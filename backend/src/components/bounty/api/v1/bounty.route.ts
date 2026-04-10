import { Router, Request, Response } from "express";
import { tryCatch } from "@utils/index";
import { AppError } from "@middlewares/error.middleware";
import { authMiddleware, optionalAuth } from "@middlewares/auth.middleware";
import { submissionUpload, MulterFiles } from "@middlewares/multer.middleware";
import { BountyService } from "@components/bounty/services/bounty.service";
import { AuthRequest } from "@utils/interface";

export class BountyRoute {
  public path = "/api/bounties";
  public router = Router();
  private service = new BountyService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // List bounties (public)
    this.router.get(
      `${this.path}`,
      tryCatch(async (req: Request, res: Response) => {
        const { category, tags, status, page, limit, sortBy, sortOrder } = req.query as Record<string, string>;
        const { data, code } = await this.service.listBounties({
          category: category as import("@components/dataset/database/models").DatasetCategory,
          tags,
          status,
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          sortBy,
          sortOrder,
        });
        res.status(code).json(data);
      })
    );

    // Get single bounty (optional auth for ownership context)
    this.router.get(
      `${this.path}/:id`,
      optionalAuth,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const userId = req.user?.userId || "";
        const { data, code } = await this.service.getBounty(id, userId);
        res.status(code).json(data);
      })
    );

    // Initiate bounty (build unsigned txn group)
    this.router.post(
      `${this.path}`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { title, description, category, tags, rewardUSDC, deadline } = req.body;
        if (!title || !description || !category || !rewardUSDC || !deadline) {
          throw new AppError("ValidationError", 400, "Missing required fields", true);
        }
        const { data, code } = await this.service.initiateBounty(
          req.user!.userId,
          req.user!.walletAddress,
          {
            title,
            description,
            category,
            tags: tags || [],
            rewardUSDC: parseFloat(rewardUSDC),
            deadline: new Date(deadline),
          }
        );
        res.status(code).json(data);
      })
    );

    // Confirm bounty after on-chain transaction
    this.router.post(
      `${this.path}/:id/confirm`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { txId, bountyData } = req.body;
        if (!txId || !bountyData) {
          throw new AppError("ValidationError", 400, "txId and bountyData required", true);
        }
        const { data, code } = await this.service.confirmBounty(
          req.user!.userId,
          req.user!.walletAddress,
          id,
          txId,
          bountyData
        );
        res.status(code).json(data);
      })
    );

    // Submit to bounty (file upload)
    this.router.post(
      `${this.path}/:id/submit`,
      authMiddleware,
      submissionUpload,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const files = req.files as MulterFiles;
        if (!files?.sampleFile?.[0] || !files?.fullDataFile?.[0]) {
          throw new AppError("ValidationError", 400, "Both sampleFile and fullDataFile are required", true);
        }
        const { title, description } = req.body;
        if (!title || !description) {
          throw new AppError("ValidationError", 400, "Title and description required", true);
        }
        const { data, code } = await this.service.submitToBounty(
          req.user!.userId,
          req.user!.walletAddress,
          id,
          { title, description },
          files.sampleFile[0],
          files.fullDataFile[0]
        );
        res.status(code).json(data);
      })
    );

    // Accept a submission (returns unsigned txn)
    this.router.post(
      `${this.path}/:id/accept/:submissionId`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id, submissionId } = req.params as Record<string, string>;
        const { data, code } = await this.service.acceptSubmission(
          req.user!.userId,
          id,
          submissionId
        );
        res.status(code).json(data);
      })
    );

    // Confirm acceptance after on-chain transaction
    this.router.post(
      `${this.path}/:id/accept/:submissionId/confirm`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id, submissionId } = req.params as Record<string, string>;
        const { txId } = req.body;
        if (!txId) throw new AppError("ValidationError", 400, "txId required", true);
        const { data, code } = await this.service.confirmAcceptance(
          req.user!.userId,
          id,
          submissionId,
          txId
        );
        res.status(code).json(data);
      })
    );

    // Initiate refund (returns unsigned txn)
    this.router.post(
      `${this.path}/:id/refund`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { data, code } = await this.service.initiateRefund(req.user!.userId, id);
        res.status(code).json(data);
      })
    );

    // Confirm refund
    this.router.post(
      `${this.path}/:id/refund/confirm`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { txId } = req.body;
        if (!txId) throw new AppError("ValidationError", 400, "txId required", true);
        const { data, code } = await this.service.confirmRefund(req.user!.userId, id, txId);
        res.status(code).json(data);
      })
    );
  }
}
