import { DatasetRepository } from "../database/repository/dataset.repository";
import { UserRepository } from "@components/user/database/repository/user.repository";
import { PurchaseRepository } from "@components/purchase/database/repository/purchase.repository";
import { uploadPublicFile, uploadPrivateFile, getSignedUrl } from "@libraries/pinata.service";
import { AppError } from "@middlewares/error.middleware";
import { returnDataObj, getPagination } from "@utils/index";
import { DatasetCategory, DatasetFormat, DatasetStatus } from "../database/models";
import { FilterQuery } from "mongoose";
import { IDataset } from "../database/models";

const datasetRepo = new DatasetRepository();
const userRepo = new UserRepository();
const purchaseRepo = new PurchaseRepository();

export class DatasetService {
  async listDatasets({
    category,
    tags,
    format,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  }: {
    category?: DatasetCategory;
    tags?: string;
    format?: DatasetFormat;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const filter: FilterQuery<IDataset> = { status: "active" };

    if (category) filter.category = category;
    if (format) filter.format = format;
    if (minPrice || maxPrice) {
      filter.priceUSDC = {};
      if (minPrice) filter.priceUSDC.$gte = parseFloat(minPrice);
      if (maxPrice) filter.priceUSDC.$lte = parseFloat(maxPrice);
    }
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const { limitNumber, pageNumber, skipNumber } = getPagination({ limit, page });
    const sort = `${sortOrder === "asc" ? "" : "-"}${sortBy === "price" ? "priceUSDC" : sortBy === "purchases" ? "totalPurchases" : "createdAt"}`;

    const [datasets, total] = await Promise.all([
      datasetRepo.findAll({ filter, skip: skipNumber, limit: limitNumber, sort }),
      datasetRepo.getCount(filter),
    ]);

    return returnDataObj({
      datasets,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  }

  async getDataset(id: string) {
    const dataset = await datasetRepo.findById(id);
    if (!dataset) throw new AppError("NotFound", 404, "Dataset not found", true);
    if (dataset.status === "unlisted") throw new AppError("NotFound", 404, "Dataset not found", true);

    const { fullDataIpfsCid: _omit, ...safeDataset } = (dataset.toObject ? dataset.toObject() : dataset) as IDataset & { fullDataIpfsCid?: string };
    return returnDataObj({ dataset: safeDataset });
  }

  async createDataset(
    userId: string,
    walletAddress: string,
    data: {
      title: string;
      description: string;
      category: DatasetCategory;
      tags: string[];
      priceUSDC: number;
      format: DatasetFormat;
      recordCount: number;
      sizeBytes: number;
      sellerAttestationAccepted: boolean;
    },
    sampleFile: Express.Multer.File,
    fullDataFile: Express.Multer.File
  ) {
    if (!data.sellerAttestationAccepted) {
      throw new AppError(
        "ValidationError",
        400,
        "You must confirm you have the right to share this dataset and accept responsibility for its content",
        true
      );
    }

    // Verify user is opted into USDC to receive payments
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError("NotFound", 404, "User not found", true);
    if (!user.isUSDCOptedIn) {
      throw new AppError("ValidationError", 400, "You must opt-in to USDC before listing a dataset", true);
    }

    // Validate price range
    if (data.priceUSDC < 0.1 || data.priceUSDC > 100) {
      throw new AppError("ValidationError", 400, "Price must be between $0.10 and $100.00 USDC", true);
    }

    // Upload files to Pinata
    const [sampleCid, fullDataCid] = await Promise.all([
      uploadPublicFile(sampleFile.buffer, sampleFile.originalname),
      uploadPrivateFile(fullDataFile.buffer, fullDataFile.originalname),
    ]);

    const dataset = await datasetRepo.create({
      sellerId: userId as unknown as import("mongoose").Types.ObjectId,
      sellerWalletAddress: walletAddress,
      ...data,
      sampleIpfsCid: sampleCid,
      sampleFileName: sampleFile.originalname,
      fullDataIpfsCid: fullDataCid,
      fullDataFileName: fullDataFile.originalname,
    });

    const { fullDataIpfsCid: _omit, ...safeDataset } = (dataset.toObject ? dataset.toObject() : dataset) as IDataset & { fullDataIpfsCid?: string };
    return returnDataObj({ dataset: safeDataset }, 201);
  }

  async updateDataset(
    userId: string,
    isAdmin: boolean,
    datasetId: string,
    updates: { title?: string; description?: string; tags?: string[]; priceUSDC?: number; status?: DatasetStatus }
  ) {
    const dataset = await datasetRepo.findById(datasetId);
    if (!dataset) throw new AppError("NotFound", 404, "Dataset not found", true);

    if (!isAdmin && dataset.sellerId.toString() !== userId) {
      throw new AppError("AuthError", 403, "Not authorized to update this dataset", true);
    }

    if (updates.priceUSDC !== undefined && (updates.priceUSDC < 0.1 || updates.priceUSDC > 100)) {
      throw new AppError("ValidationError", 400, "Price must be between $0.10 and $100.00", true);
    }

    const updated = await datasetRepo.update(datasetId, updates);
    if (!updated) throw new AppError("NotFound", 404, "Dataset not found", true);

    const { fullDataIpfsCid: _omit, ...safeDataset } = (updated.toObject ? updated.toObject() : updated) as IDataset & { fullDataIpfsCid?: string };
    return returnDataObj({ dataset: safeDataset });
  }

  async softDeleteDataset(userId: string, isAdmin: boolean, datasetId: string) {
    const dataset = await datasetRepo.findById(datasetId);
    if (!dataset) throw new AppError("NotFound", 404, "Dataset not found", true);

    if (!isAdmin && dataset.sellerId.toString() !== userId) {
      throw new AppError("AuthError", 403, "Not authorized to delete this dataset", true);
    }

    await datasetRepo.update(datasetId, { status: "unlisted" });
    return returnDataObj({ success: true });
  }

  /**
   * Called after x402 payment verification/settlement OR for re-downloads.
   * Purchase recording for NEW purchases is handled by the x402 onAfterSettle hook
   * in x402.service.ts. This method handles re-download tracking and URL generation.
   */
  async getDownloadUrlAfterPayment(
    datasetId: string,
    buyerWalletAddress?: string,
    buyerId?: string
  ) {
    const dataset = await datasetRepo.findByIdWithFullData(datasetId);
    if (!dataset) throw new AppError("NotFound", 404, "Dataset not found", true);

    if (buyerWalletAddress) {
      const existingPurchase = await purchaseRepo.findByWalletAndDataset(
        buyerWalletAddress,
        datasetId
      );
      if (existingPurchase) {
        await purchaseRepo.incrementDownload(existingPurchase._id as string);
      }

      if (buyerId) {
        const buyer = await userRepo.findById(buyerId);
        if (buyer && !existingPurchase) {
          await userRepo.update(buyerId, {
            totalSpent: (buyer.totalSpent || 0) + dataset.priceUSDC,
          });
        }
      }
    }

    const downloadUrl = getSignedUrl(dataset.fullDataIpfsCid);
    const expiresAt = Date.now() + 60 * 60 * 1000;

    return returnDataObj({
      downloadUrl,
      fileName: dataset.fullDataFileName,
      expiresAt,
    });
  }
}
