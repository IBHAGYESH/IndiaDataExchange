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
import { AppError } from "@middlewares/error.middleware";

const nonceRepo = new NonceRepository();
const userRepo = new UserRepository();

export class AuthService {
  async generateNonce(walletAddress: string) {
    const nonce = uuidv4();
    await nonceRepo.create(walletAddress, nonce);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const existing = await userRepo.findByWallet(walletAddress);
    const privacyConsentRequired = !existing?.consentGivenAt;
    return returnDataObj({ nonce, expiresAt, privacyConsentRequired });
  }

  async verifyAndIssueJWT(
    walletAddress: string,
    nonce: string,
    signedTxnBase64: string,
    privacyConsentAccepted?: boolean
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
    const existing = await userRepo.findByWallet(walletAddress);
    if (!existing && !privacyConsentAccepted) {
      throw new AppError(
        "ValidationError",
        400,
        "You must accept the Privacy Policy and Terms to create an account",
        true
      );
    }
    if (existing && !existing.consentGivenAt && !privacyConsentAccepted) {
      throw new AppError(
        "ValidationError",
        400,
        "You must accept the Privacy Policy and Terms to continue",
        true
      );
    }

    const user = await userRepo.findOrCreate(walletAddress, isAdmin);

    if (!user.consentGivenAt) {
      if (!privacyConsentAccepted) {
        throw new AppError("ValidationError", 400, "Privacy consent required", true);
      }
      await userRepo.update(user._id!.toString(), { consentGivenAt: new Date() });
      user.consentGivenAt = new Date();
    }

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
