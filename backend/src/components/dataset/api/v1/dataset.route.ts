import { Router, Request, Response } from "express";
import { tryCatch } from "@utils/index";
import { getPublicApiOrigin } from "@utils/publicApiUrl";
import { AppError } from "@middlewares/error.middleware";
import { authMiddleware, optionalAuth } from "@middlewares/auth.middleware";
import { datasetUpload, MulterFiles } from "@middlewares/multer.middleware";
import { DatasetService } from "@components/dataset/services/dataset.service";
import { AuthRequest } from "@utils/interface";

export class DatasetRoute {
  public path = "/api/datasets";
  public router = Router();
  private service = new DatasetService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public: list all active datasets
    this.router.get(
      `${this.path}`,
      tryCatch(async (req: Request, res: Response) => {
        const { category, tags, format, minPrice, maxPrice, search, page, limit, sortBy, sortOrder } =
          req.query as Record<string, string>;
        const { data, code } = await this.service.listDatasets({
          category: category as import("@components/dataset/database/models").DatasetCategory,
          tags,
          format: format as import("@components/dataset/database/models").DatasetFormat,
          minPrice,
          maxPrice,
          search,
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          sortBy,
          sortOrder,
          apiPublicOrigin: getPublicApiOrigin(req),
        });
        res.status(code).json(data);
      })
    );

    // Public: get single dataset (no fullDataIpfsCid)
    this.router.get(
      `${this.path}/:id`,
      tryCatch(async (req: Request, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { data, code } = await this.service.getDataset(id, getPublicApiOrigin(req));
        res.status(code).json(data);
      })
    );

    // Auth required: create dataset (file upload)
    this.router.post(
      `${this.path}`,
      authMiddleware,
      datasetUpload,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const files = req.files as MulterFiles;
        if (!files?.sampleFile?.[0] || !files?.fullDataFile?.[0]) {
          throw new AppError("ValidationError", 400, "Both sampleFile and fullDataFile are required", true);
        }

        const { title, description, category, tags, priceUSDC, format, recordCount, sizeBytes, sellerAttestationAccepted } =
          req.body;
        if (!title || !description || !category || !priceUSDC || !format) {
          throw new AppError("ValidationError", 400, "Missing required fields", true);
        }

        const attestationOk =
          sellerAttestationAccepted === true ||
          sellerAttestationAccepted === "true" ||
          sellerAttestationAccepted === "1";

        const parsedTags = typeof tags === "string" ? JSON.parse(tags) : (tags || []);

        const { data, code } = await this.service.createDataset(
          req.user!.userId,
          req.user!.walletAddress,
          {
            title,
            description,
            category,
            tags: parsedTags,
            priceUSDC: parseFloat(priceUSDC),
            format,
            recordCount: parseInt(recordCount) || 0,
            sizeBytes: parseInt(sizeBytes) || 0,
            sellerAttestationAccepted: attestationOk,
          },
          files.sampleFile[0],
          files.fullDataFile[0]
        );
        res.status(code).json(data);
      })
    );

    // Auth required: update dataset
    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { title, description, tags, priceUSDC, status } = req.body;
        const { data, code } = await this.service.updateDataset(
          req.user!.userId,
          req.user!.isAdmin,
          id,
          { title, description, tags, priceUSDC: priceUSDC ? parseFloat(priceUSDC) : undefined, status }
        );
        res.status(code).json(data);
      })
    );

    // Auth required: soft delete dataset
    this.router.delete(
      `${this.path}/:id`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { data, code } = await this.service.softDeleteDataset(
          req.user!.userId,
          req.user!.isAdmin,
          id
        );
        res.status(code).json(data);
      })
    );

    // Download route — protected by x402 payment middleware (applied globally in app.ts).
    // By the time this handler runs, payment has been verified by the facilitator
    // OR the buyer has existing access (re-download granted by onProtectedRequest hook).
    this.router.get(
      `${this.path}/:id/download`,
      optionalAuth,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;

        const { data, code } = await this.service.getDownloadUrlAfterPayment(
          id,
          req.user?.walletAddress || (req.headers["x-payment-wallet"] as string),
          req.user?.userId
        );
        res.status(code).json(data);
      })
    );
  }
}
