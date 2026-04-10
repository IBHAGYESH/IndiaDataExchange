import { UserModel, IUser } from "../models";
import { FilterQuery } from "mongoose";

export class UserRepository {
  private model = UserModel;

  async create(data: Partial<IUser>) {
    const user = new this.model(data);
    return await user.save();
  }

  async findByWallet(walletAddress: string) {
    return await this.model.findOne({ walletAddress });
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async update(id: string, data: Partial<IUser>) {
    return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async findOrCreate(walletAddress: string, isAdmin = false): Promise<InstanceType<typeof UserModel> & { isNew?: boolean }> {
    let user = await this.model.findOne({ walletAddress });
    if (!user) {
      user = await this.model.create({ walletAddress, isAdmin });
      (user as unknown as { isNew: boolean }).isNew = true;
    } else if (isAdmin && !user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }
    return user as InstanceType<typeof UserModel> & { isNew?: boolean };
  }

  async getCount(filter: FilterQuery<IUser>) {
    return await this.model.countDocuments(filter);
  }
}
