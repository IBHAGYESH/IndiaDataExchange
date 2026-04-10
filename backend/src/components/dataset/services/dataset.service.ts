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
    },
    sampleFile: Express.Multer.File,
    fullDataFile: Express.Multer.File
  ) {
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

  async getDownloadUrl(
    datasetId: string,
    buyerWalletAddress: string,
    paymentTxId: string,
    isHuman: boolean,
    buyerId?: string
  ) {
    const dataset = await datasetRepo.findById(datasetId);
    if (!dataset) throw new AppError("NotFound", 404, "Dataset not found", true);

    // Check for existing valid access (re-download)
    const hasAccess = await purchaseRepo.hasValidAccess(buyerWalletAddress, datasetId);

    if (!hasAccess) {
      // Create purchase record
      const expiresAt = isHuman ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000);
      await purchaseRepo.create({
        buyerWalletAddress,
        buyerId: buyerId as unknown as import("mongoose").Types.ObjectId | undefined,
        datasetId: datasetId as unknown as import("mongoose").Types.ObjectId,
        paymentTxId,
        amountPaidUSDC: dataset.priceUSDC,
        downloadCount: 1,
        lastDownloadAt: new Date(),
        redownloadExpiresAt: expiresAt,
        isHuman,
      });

      // Increment total purchases on dataset
      await datasetRepo.incrementPurchases(datasetId);

      // Update seller's totalEarnings
      const seller = await userRepo.findByWallet(dataset.sellerWalletAddress);
      if (seller) {
        await userRepo.update(seller._id!.toString(), {
          totalEarnings: (seller.totalEarnings || 0) + dataset.priceUSDC,
        });
      }

      // Update buyer's totalSpent if human
      if (isHuman && buyerId) {
        const buyer = await userRepo.findById(buyerId);
        if (buyer) {
          await userRepo.update(buyerId, {
            totalSpent: (buyer.totalSpent || 0) + dataset.priceUSDC,
          });
        }
      }
    } else {
      // Update download count
      const purchase = await purchaseRepo.findByWalletAndDataset(buyerWalletAddress, datasetId);
      if (purchase) {
        await purchaseRepo.incrementDownload(purchase._id as string);
      }
    }

    const fullDataset = await datasetRepo.findById(datasetId);
    const downloadUrl = getSignedUrl(fullDataset!.fullDataIpfsCid);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    return returnDataObj({
      downloadUrl,
      fileName: fullDataset!.fullDataFileName,
      expiresAt,
    });
  }
}
