import { SubmissionModel, ISubmission } from "../models";

export class SubmissionRepository {
  public model = SubmissionModel;

  async create(data: Partial<ISubmission>) {
    return await this.model.create(data);
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async update(id: string, data: Partial<ISubmission>) {
    return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async findByBountyId(bountyId: string) {
    return await this.model
      .find({ bountyId })
      .select("-fullDataIpfsCid")
      .sort("-createdAt")
      .lean();
  }

  async findBySellerAndBounty(sellerId: string, bountyId: string) {
    return await this.model.findOne({ sellerId, bountyId }).lean();
  }

  async findByBountyIdWithFullData(bountyId: string) {
    return await this.model.find({ bountyId }).sort("-createdAt").lean();
  }

  async findBySellerId(sellerId: string) {
    return await this.model
      .find({ sellerId })
      .select("-fullDataIpfsCid")
      .populate("bountyId", "title rewardUSDC status deadline")
      .sort("-createdAt")
      .lean();
  }

  /** Includes fullDataIpfsCid for server-side signed URLs (not sent to client raw). */
  async findBySellerIdWithFullData(sellerId: string) {
    return await this.model
      .find({ sellerId })
      .populate("bountyId", "title rewardUSDC status deadline")
      .sort("-createdAt")
      .lean();
  }

  async rejectAllExcept(bountyId: string, winnerSubmissionId: string) {
    return await this.model.updateMany(
      { bountyId, _id: { $ne: winnerSubmissionId } },
      { status: "rejected" }
    );
  }
}
