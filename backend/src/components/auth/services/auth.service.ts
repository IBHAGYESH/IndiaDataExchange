import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { appConfig } from "@/config";
import { NonceRepository } from "../database/repository/nonce.repository";
import { UserRepository } from "@components/user/database/repository/user.repository";
import {
  verifySignedAuthTransaction,
  isOptedIntoUSDC,
  getUSDCBalance,
  buildOptInTransaction,
  submitSignedTransaction,
} from "@libraries/algorand.service";
import { returnDataObj } from "@utils/index";

const nonceRepo = new NonceRepository();
const userRepo = new UserRepository();

export class AuthService {
  async generateNonce(walletAddress: string) {
    const nonce = uuidv4();
    await nonceRepo.create(walletAddress, nonce);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    return returnDataObj({ nonce, expiresAt });
  }

  async verifyAndIssueJWT(
    walletAddress: string,
    nonce: string,
    signedTxnBase64: string
  ) {
    const nonceRecord = await nonceRepo.findValid(walletAddress, nonce);
    if (!nonceRecord) {
      throw new Error("Invalid or expired nonce");
    }

    const isValid = verifySignedAuthTransaction(
      walletAddress,
      nonce,
      signedTxnBase64
    );
    if (!isValid) {
      throw new Error("Invalid signature — wallet ownership could not be verified");
    }

    await nonceRepo.delete(walletAddress);

    const isAdmin = appConfig.admin.walletAddress === walletAddress;
    const user = await userRepo.findOrCreate(walletAddress, isAdmin);

    const optedIn = await isOptedIntoUSDC(walletAddress);
    if (user && user.isUSDCOptedIn !== optedIn) {
      await userRepo.update(user._id!.toString(), { isUSDCOptedIn: optedIn });
      user.isUSDCOptedIn = optedIn;
    }

    const payload = {
      walletAddress,
      userId: user._id?.toString() ?? "",
      isAdmin: user.isAdmin,
    };

    const token = jwt.sign(payload, appConfig.jwt.secret, {
      expiresIn: appConfig.jwt.expiresIn,
    } as jwt.SignOptions);

    return returnDataObj({ token, user });
  }

  async checkUSDCStatus(walletAddress: string) {
    const [isOptedIn, usdcBalance] = await Promise.all([
      isOptedIntoUSDC(walletAddress),
      getUSDCBalance(walletAddress),
    ]);
    return returnDataObj({ isOptedIn, usdcBalance });
  }

  async buildOptIn(walletAddress: string) {
    const unsignedTxnBase64 = await buildOptInTransaction(walletAddress);
    return returnDataObj({ unsignedTxnBase64 });
  }

  async submitOptIn(walletAddress: string, signedTxnBase64: string) {
    const txId = await submitSignedTransaction(signedTxnBase64);

    const user = await userRepo.findByWallet(walletAddress);
    if (user) {
      await userRepo.update(user._id!.toString(), { isUSDCOptedIn: true });
    }

    return returnDataObj({ txId, success: true });
  }
}
