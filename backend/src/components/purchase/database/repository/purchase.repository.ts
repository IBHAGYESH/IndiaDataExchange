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

  async hasValidAccess(buyerWalletAddress: string, datasetId: string): Promise<boolean> {
    const purchase = await this.model.findOne({ buyerWalletAddress, datasetId });
    if (!purchase) return false;
    if (purchase.isHuman) return true;
    if (purchase.redownloadExpiresAt && purchase.redownloadExpiresAt > new Date()) return true;
    return false;
  }
}
