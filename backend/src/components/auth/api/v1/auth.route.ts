import { Router, Request, Response } from "express";
import { tryCatch } from "@utils/index";
import { AppError } from "@middlewares/error.middleware";
import { AuthService } from "@components/auth/services/auth.service";

export class AuthRoute {
  public path = "/auth";
  public router = Router();
  private service = new AuthService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/nonce/:walletAddress`,
      tryCatch(async (req: Request, res: Response) => {
        const { walletAddress } = req.params;
        if (!walletAddress) throw new AppError("ValidationError", 400, "walletAddress required", true);
        const { data, code } = await this.service.generateNonce(walletAddress);
        res.status(code).json(data);
      })
    );

    this.router.post(
      `${this.path}/verify`,
      tryCatch(async (req: Request, res: Response) => {
        const { walletAddress, signature, nonce } = req.body;
        if (!walletAddress || !signature || !nonce) {
          throw new AppError("ValidationError", 400, "walletAddress, signature, and nonce required", true);
        }
        const { data, code } = await this.service.verifyAndIssueJWT(walletAddress, nonce, signature);
        res.status(code).json(data);
      })
    );

    this.router.get(
      `${this.path}/usdc-status/:walletAddress`,
      tryCatch(async (req: Request, res: Response) => {
        const { walletAddress } = req.params;
        const { data, code } = await this.service.checkUSDCStatus(walletAddress);
        res.status(code).json(data);
      })
    );

    this.router.post(
      `${this.path}/build-optin`,
      tryCatch(async (req: Request, res: Response) => {
        const { walletAddress } = req.body;
        if (!walletAddress) throw new AppError("ValidationError", 400, "walletAddress required", true);
        const { data, code } = await this.service.buildOptIn(walletAddress);
        res.status(code).json(data);
      })
    );

    this.router.post(
      `${this.path}/submit-optin`,
      tryCatch(async (req: Request, res: Response) => {
        const { walletAddress, signedTxnBase64 } = req.body;
        if (!walletAddress || !signedTxnBase64) {
          throw new AppError("ValidationError", 400, "walletAddress and signedTxnBase64 required", true);
        }
        const { data, code } = await this.service.submitOptIn(walletAddress, signedTxnBase64);
        res.status(code).json(data);
      })
    );
  }
}
