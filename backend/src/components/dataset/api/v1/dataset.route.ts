import { Router, Request, Response } from "express";
import { tryCatch } from "@utils/index";
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
        });
        res.status(code).json(data);
      })
    );

    // Public: get single dataset (no fullDataIpfsCid)
    this.router.get(
      `${this.path}/:id`,
      tryCatch(async (req: Request, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const { data, code } = await this.service.getDataset(id);
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

        const { title, description, category, tags, priceUSDC, format, recordCount, sizeBytes } = req.body;
        if (!title || !description || !category || !priceUSDC || !format) {
          throw new AppError("ValidationError", 400, "Missing required fields", true);
        }

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

    // Download route — x402 protected (wired separately in server.ts)
    this.router.get(
      `${this.path}/:id/download`,
      optionalAuth,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { id } = req.params as Record<string, string>;
        const paymentHeader = req.headers["x-payment"] as string;
        const payerWallet = req.headers["x-payment-wallet"] as string;

        if (!paymentHeader && !payerWallet) {
          // Return 402 payment required with dataset info for x402 client
          const datasetService = new DatasetService();
          const { data: datasetData } = await datasetService.getDataset(id);
          const dataset = (datasetData as { dataset: { priceUSDC: number; sellerWalletAddress: string } }).dataset;

          res.status(402).json({
            error: "Payment Required",
            accepts: [
              {
                scheme: "exact",
                network: "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
                payTo: dataset.sellerWalletAddress,
                price: `$${dataset.priceUSDC.toFixed(2)}`,
                extra: { asset: "10458941" },
              },
            ],
          });
          return;
        }

        const walletAddress = payerWallet || req.user?.walletAddress;
        if (!walletAddress) {
          throw new AppError("ValidationError", 400, "Wallet address required", true);
        }

        const txId = paymentHeader || "redownload";
        const isHuman = !!req.user;
        const buyerId = req.user?.userId;

        const { data, code } = await this.service.getDownloadUrl(
          id,
          walletAddress,
          txId,
          isHuman,
          buyerId
        );
        res.status(code).json(data);
      })
    );
  }
}
