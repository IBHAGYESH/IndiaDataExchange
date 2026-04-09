import { DatasetModel, IDataset } from "../models";
import { FilterQuery } from "mongoose";

export class DatasetRepository {
  public model = DatasetModel;

  async create(data: Partial<IDataset>) {
    return await this.model.create(data);
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async findByIdWithFullData(id: string) {
    return await this.model.findById(id).select("+fullDataIpfsCid");
  }

  async update(id: string, data: Partial<IDataset>) {
    return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async getCount(filter: FilterQuery<IDataset>) {
    return await this.model.countDocuments(filter);
  }

  async findAll({
    filter,
    skip = 0,
    limit = 20,
    sort = "-createdAt",
  }: {
    filter: FilterQuery<IDataset>;
    skip?: number;
    limit?: number;
    sort?: string;
  }) {
    return await this.model
      .find(filter)
      .select("-fullDataIpfsCid")
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();
  }

  async findBySellerId(sellerId: string) {
    return await this.model
      .find({ sellerId })
      .select("-fullDataIpfsCid")
      .sort("-createdAt")
      .lean();
  }

  async incrementPurchases(id: string) {
    return await this.model.findByIdAndUpdate(id, { $inc: { totalPurchases: 1 } });
  }
}
