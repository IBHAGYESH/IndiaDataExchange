import { Types } from "mongoose";
import { ANONYMIZED_WALLET_PLACEHOLDER } from "@/constants/privacy";
import { getPagination } from "@utils/index";
import { PurchaseModel, IPurchase } from "../models";

export class PurchaseRepository {
  public model = PurchaseModel;

  async create(data: Partial<IPurchase>) {
    return await this.model.create(data);
  }

  async findByWalletAndDataset(buyerWalletAddress: string, datasetId: string) {
    return await this.model.findOne({ buyerWalletAddress, datasetId });
  }

  async findByBuyerId(buyerId: string) {
    return await this.model
      .find({ buyerId })
      .populate("datasetId")
      .sort("-createdAt")
      .lean();
  }

  async findByBuyerWallet(walletAddress: string) {
    return await this.model
      .find({ buyerWalletAddress: walletAddress })
      .populate("datasetId")
      .sort("-createdAt")
      .lean();
  }

  async incrementDownload(id: string) {
    return await this.model.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 }, lastDownloadAt: new Date() },
      { new: true }
    );
  }

  async getTotalPurchasesByDataset(datasetId: string) {
    return await this.model.countDocuments({ datasetId });
  }

  async countByBuyerWallet(walletAddress: string) {
    return await this.model.countDocuments({ buyerWalletAddress: walletAddress });
  }

  async hasValidAccess(buyerWalletAddress: string, datasetId: string): Promise<boolean> {
    const purchase = await this.model.findOne({ buyerWalletAddress, datasetId });
    if (!purchase) return false;
    if (purchase.isHuman) return true;
    if (purchase.redownloadExpiresAt && purchase.redownloadExpiresAt > new Date()) return true;
    return false;
  }

  async anonymizeBuyer(buyerWalletAddress: string, buyerId: Types.ObjectId) {
    return await this.model.updateMany(
      {
        $or: [{ buyerWalletAddress }, { buyerId }],
      },
      { $set: { buyerWalletAddress: ANONYMIZED_WALLET_PLACEHOLDER, buyerId: null } }
    );
  }

  async findByDatasetIdPaginated(datasetId: string, page: number, limit: number) {
    if (!Types.ObjectId.isValid(datasetId)) {
      return { purchases: [] as IPurchase[], total: 0, page: 1, totalPages: 0 };
    }
    const oid = new Types.ObjectId(datasetId);
    const { limitNumber, pageNumber, skipNumber } = getPagination({ limit, page });
    const filter = { datasetId: oid };
    const [purchases, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skipNumber).limit(limitNumber).lean(),
      this.model.countDocuments(filter),
    ]);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limitNumber);
    return { purchases, total, page: pageNumber, totalPages };
  }
}
