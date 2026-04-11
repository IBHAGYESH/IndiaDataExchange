import { BountyModel, IBounty } from "../models";
import { FilterQuery } from "mongoose";

export class BountyRepository {
  public model = BountyModel;

  async create(data: Partial<IBounty>) {
    return await this.model.create(data);
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async update(id: string, data: Partial<IBounty>) {
    return await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async getCount(filter: FilterQuery<IBounty>) {
    return await this.model.countDocuments(filter);
  }

  async findAll({
    filter,
    skip = 0,
    limit = 20,
    sort = "-createdAt",
  }: {
    filter: FilterQuery<IBounty>;
    skip?: number;
    limit?: number;
    sort?: string;
  }) {
    return await this.model
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();
  }

  async findByBuyerId(buyerId: string) {
    return await this.model.find({ buyerId }).sort("-createdAt").lean();
  }

  async incrementSubmissionCount(id: string) {
    return await this.model.findByIdAndUpdate(id, {
      $inc: { submissionCount: 1 },
    });
  }

  async anonymizeBuyerWallet(buyerId: string, placeholderWallet: string) {
    return await this.model.updateMany(
      { buyerId },
      { $set: { buyerWalletAddress: placeholderWallet, status: "cancelled" } },
    );
  }
}
