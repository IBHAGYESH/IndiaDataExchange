import { Router, Response } from "express";
import { tryCatch, getPagination } from "@utils/index";
import { authMiddleware, adminMiddleware } from "@middlewares/auth.middleware";
import { AppError } from "@middlewares/error.middleware";
import { AuthRequest } from "@utils/interface";
import { UserRepository } from "@components/user/database/repository/user.repository";
import { DatasetRepository } from "@components/dataset/database/repository/dataset.repository";
import { BountyRepository } from "@components/bounty/database/repository/bounty.repository";
import { PurchaseRepository } from "@components/purchase/database/repository/purchase.repository";

const userRepo = new UserRepository();
const datasetRepo = new DatasetRepository();
const bountyRepo = new BountyRepository();
const purchaseRepo = new PurchaseRepository();

export class AdminRoute {
  public path = "/api/admin";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All admin routes require auth + admin
    this.router.use(`${this.path}`, authMiddleware, adminMiddleware);

    this.router.get(
      `${this.path}/stats`,
      tryCatch(async (_req: AuthRequest, res: Response) => {
        const [totalUsers, totalDatasets, totalBounties, purchaseAgg] = await Promise.all([
          userRepo.getCount({}),
          datasetRepo.getCount({}),
          bountyRepo.getCount({}),
          purchaseRepo.model
            ? (purchaseRepo as unknown as { model: { aggregate: (pipeline: unknown[]) => Promise<{_id: null; total: number}[]> } })
                .model
                .aggregate([{ $group: { _id: null, total: { $sum: "$amountPaidUSDC" } } }])
            : Promise.resolve([{ total: 0 }]),
        ]);

        res.status(200).json({
          totalUsers,
          totalDatasets,
          totalBounties,
          totalVolume: (purchaseAgg as Array<{ total?: number }>)[0]?.total || 0,
        });
      })
    );

    this.router.get(
      `${this.path}/datasets`,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { page, limit } = req.query as Record<string, string>;
        const { limitNumber, pageNumber, skipNumber } = getPagination({ limit: limit || "20", page: page || "1" });
        const [datasets, total] = await Promise.all([
          datasetRepo.model.find({}).skip(skipNumber).limit(limitNumber).sort("-createdAt").lean(),
          datasetRepo.getCount({}),
        ]);
        res.status(200).json({ datasets, total, page: pageNumber, totalPages: Math.ceil(total / limitNumber) });
      })
    );

    this.router.patch(
      `${this.path}/datasets/:id/status`,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;
        if (!["active", "unlisted"].includes(status)) {
          throw new AppError("ValidationError", 400, "Invalid status", true);
        }
        const dataset = await datasetRepo.update(id, { status });
        res.status(200).json({ dataset });
      })
    );

    this.router.get(
      `${this.path}/bounties`,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { page, limit } = req.query as Record<string, string>;
        const { limitNumber, pageNumber, skipNumber } = getPagination({ limit: limit || "20", page: page || "1" });
        const [bounties, total] = await Promise.all([
          bountyRepo.model.find({}).skip(skipNumber).limit(limitNumber).sort("-createdAt").lean(),
          bountyRepo.getCount({}),
        ]);
        res.status(200).json({ bounties, total, page: pageNumber, totalPages: Math.ceil(total / limitNumber) });
      })
    );

    this.router.patch(
      `${this.path}/bounties/:id/status`,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;
        if (!["open", "accepted", "cancelled", "expired"].includes(status)) {
          throw new AppError("ValidationError", 400, "Invalid status", true);
        }
        const bounty = await bountyRepo.update(id, { status });
        res.status(200).json({ bounty });
      })
    );
  }
}
