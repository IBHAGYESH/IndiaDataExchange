import { BountyRepository } from "../database/repository/bounty.repository";
import { SubmissionRepository } from "@components/submission/database/repository/submission.repository";
import { UserRepository } from "@components/user/database/repository/user.repository";
import { uploadPublicFile, uploadPrivateFile, getSignedUrl } from "@libraries/pinata.service";
import {
  buildBountyEscrowTxnGroup,
  buildAcceptSubmissionTxn,
  buildRefundBountyTxn,
  verifyTransaction,
  isOptedIntoUSDC,
} from "@libraries/algorand.service";
import { AppError } from "@middlewares/error.middleware";
import { returnDataObj, getPagination } from "@utils/index";
import { DatasetCategory, DatasetFormat } from "@components/dataset/database/models";
import { FilterQuery } from "mongoose";
import { IBounty } from "../database/models";

const bountyRepo = new BountyRepository();
const submissionRepo = new SubmissionRepository();
const userRepo = new UserRepository();

const DATASET_FORMATS: DatasetFormat[] = ["csv", "json", "images", "audio", "video", "pdf", "other"];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class BountyService {
  async listBounties({
    category,
    tags,
    search,
    status = "open",
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  }: {
    category?: DatasetCategory;
    tags?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const filter: FilterQuery<IBounty> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }
    const q = search?.trim();
    if (q) {
      const rx = new RegExp(escapeRegExp(q), "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }

    const { limitNumber, pageNumber, skipNumber } = getPagination({ limit, page });
    const sort = `${sortOrder === "asc" ? "" : "-"}${sortBy === "reward" ? "rewardUSDC" : sortBy === "deadline" ? "deadline" : "createdAt"}`;

    const [bounties, total] = await Promise.all([
      bountyRepo.findAll({ filter, skip: skipNumber, limit: limitNumber, sort }),
      bountyRepo.getCount(filter),
    ]);

    return returnDataObj({ bounties, total, page: pageNumber, totalPages: Math.ceil(total / limitNumber) });
  }

  async getBounty(bountyId: string, requesterId?: string) {
    const bounty = await bountyRepo.findById(bountyId);
    if (!bounty) throw new AppError("NotFound", 404, "Bounty not found", true);

    const bountyObj = bounty.toObject ? bounty.toObject() : bounty;

    let submissions: unknown = null;
    let hasSubmitted = false;
    if (requesterId) {
      if (bounty.buyerId.toString() === requesterId) {
        const rawSubs = await submissionRepo.findByBountyIdWithFullData(bountyId);
        submissions = rawSubs.map((s: Record<string, unknown>) => {
          const { fullDataIpfsCid, ...rest } = s;
          const cid = fullDataIpfsCid as string | undefined;
          return {
            ...rest,
            ...(s.status === "accepted" && cid ? { downloadUrl: getSignedUrl(cid) } : {}),
          };
        });
      } else {
        const existing = await submissionRepo.findBySellerAndBounty(requesterId, bountyId);
        hasSubmitted = !!existing;
      }
    }

    return returnDataObj({ bounty: { ...bountyObj, submissions, hasSubmitted } });
  }

  async initiateBounty(
    userId: string,
    walletAddress: string,
    data: {
      title: string;
      description: string;
      category: DatasetCategory;
      tags: string[];
      rewardUSDC: number;
      deadline: Date;
    }
  ) {
    // Validate reward range
    if (data.rewardUSDC < 1 || data.rewardUSDC > 1000) {
      throw new AppError("ValidationError", 400, "Reward must be between $1.00 and $1000.00 USDC", true);
    }

    // Check user's USDC opt-in
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError("NotFound", 404, "User not found", true);
    if (!user.isUSDCOptedIn) {
      throw new AppError("ValidationError", 400, "You must opt-in to USDC before posting a bounty", true);
    }

    // Create a temporary bountyId (will be confirmed after on-chain tx)
    const { v4: uuidv4 } = await import("uuid");
    const bountyId = uuidv4().replace(/-/g, "").slice(0, 24); // 24 char mongo-like ID

    const deadline = Math.floor(new Date(data.deadline).getTime() / 1000);

    const { unsignedTxnGroupBase64 } = await buildBountyEscrowTxnGroup(
      walletAddress,
      bountyId,
      data.rewardUSDC,
      deadline
    );

    // Store pending bounty data in memory (will be confirmed after signing)
    // Return to frontend for signing
    return returnDataObj({ unsignedTxnGroupBase64, bountyId, bountyData: data });
  }

  async confirmBounty(
    userId: string,
    walletAddress: string,
    bountyId: string,
    txId: string,
    bountyData: {
      title: string;
      description: string;
      category: DatasetCategory;
      tags: string[];
      rewardUSDC: number;
      deadline: Date;
    }
  ) {
    // Verify transaction on Algorand indexer
    try {
      await verifyTransaction(txId);
    } catch {
      throw new AppError("ValidationError", 400, "Transaction not found or not confirmed", true);
    }

    const bounty = await bountyRepo.create({
      buyerId: userId as unknown as import("mongoose").Types.ObjectId,
      buyerWalletAddress: walletAddress,
      ...bountyData,
      escrowTxId: txId,
      contractBountyId: bountyId,
    });

    // Update buyer's totalSpent
    const user = await userRepo.findById(userId);
    if (user) {
      await userRepo.update(userId, {
        totalSpent: (user.totalSpent || 0) + bountyData.rewardUSDC,
      });
    }

    return returnDataObj({ bounty }, 201);
  }

  async submitToBounty(
    userId: string,
    walletAddress: string,
    bountyId: string,
    data: {
      title: string;
      description: string;
      format: string;
      recordCount: number;
      submitterAttestationAccepted: boolean;
    },
    sampleFile: Express.Multer.File,
    fullDataFile: Express.Multer.File
  ) {
    if (!data.submitterAttestationAccepted) {
      throw new AppError(
        "ValidationError",
        400,
        "You must confirm you have the right to share this data and accept responsibility for its content",
        true
      );
    }

    if (!DATASET_FORMATS.includes(data.format as DatasetFormat)) {
      throw new AppError("ValidationError", 400, "Invalid dataset format", true);
    }

    const bounty = await bountyRepo.findById(bountyId);
    if (!bounty) throw new AppError("NotFound", 404, "Bounty not found", true);
    if (bounty.status !== "open") throw new AppError("ValidationError", 400, "Bounty is no longer accepting submissions", true);
    if (new Date() > bounty.deadline) throw new AppError("ValidationError", 400, "Bounty deadline has passed", true);
    if (bounty.buyerId.toString() === userId) {
      throw new AppError("ValidationError", 400, "You cannot submit to your own bounty", true);
    }

    // Check USDC opt-in (to receive payment if accepted)
    const optedIn = await isOptedIntoUSDC(walletAddress);
    if (!optedIn) {
      throw new AppError("ValidationError", 400, "You must opt-in to USDC to submit a bounty response", true);
    }

    const [sampleCid, fullDataCid] = await Promise.all([
      uploadPublicFile(sampleFile.buffer, sampleFile.originalname),
      uploadPrivateFile(fullDataFile.buffer, fullDataFile.originalname),
    ]);

    const sizeBytes =
      typeof fullDataFile.size === "number" && fullDataFile.size >= 0
        ? fullDataFile.size
        : fullDataFile.buffer?.length ?? 0;

    const submission = await submissionRepo.create({
      bountyId: bountyId as unknown as import("mongoose").Types.ObjectId,
      sellerId: userId as unknown as import("mongoose").Types.ObjectId,
      sellerWalletAddress: walletAddress,
      title: data.title,
      description: data.description,
      format: data.format as DatasetFormat,
      recordCount: data.recordCount,
      sizeBytes,
      sampleIpfsCid: sampleCid,
      sampleFileName: sampleFile.originalname,
      fullDataIpfsCid: fullDataCid,
      fullDataFileName: fullDataFile.originalname,
    });

    await bountyRepo.incrementSubmissionCount(bountyId);

    const { fullDataIpfsCid: _omit, ...safeSubmission } = submission.toObject ? submission.toObject() : submission;
    return returnDataObj({ submission: safeSubmission }, 201);
  }

  async acceptSubmission(userId: string, bountyId: string, submissionId: string) {
    const bounty = await bountyRepo.findById(bountyId);
    if (!bounty) throw new AppError("NotFound", 404, "Bounty not found", true);
    if (bounty.buyerId.toString() !== userId) {
      throw new AppError("AuthError", 403, "Only the bounty poster can accept submissions", true);
    }
    if (bounty.status !== "open") throw new AppError("ValidationError", 400, "Bounty is not open", true);

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) throw new AppError("NotFound", 404, "Submission not found", true);
    if (submission.bountyId.toString() !== bountyId) {
      throw new AppError("ValidationError", 400, "Submission does not belong to this bounty", true);
    }

    // Check winner USDC opt-in
    const winnerOptedIn = await isOptedIntoUSDC(submission.sellerWalletAddress);
    if (!winnerOptedIn) {
      throw new AppError("ValidationError", 400, "Winner has not opted-in to USDC", true);
    }

    // Build accept submission transaction for buyer to sign
    const unsignedTxnBase64 = await buildAcceptSubmissionTxn(
      bounty.buyerWalletAddress,
      bounty.contractBountyId,
      submission.sellerWalletAddress
    );

    return returnDataObj({ unsignedTxnBase64, submissionId });
  }

  async confirmAcceptance(userId: string, bountyId: string, submissionId: string, txId: string) {
    const bounty = await bountyRepo.findById(bountyId);
    if (!bounty) throw new AppError("NotFound", 404, "Bounty not found", true);
    if (bounty.buyerId.toString() !== userId) {
      throw new AppError("AuthError", 403, "Only the bounty poster can confirm acceptance", true);
    }

    // Verify transaction
    try {
      await verifyTransaction(txId);
    } catch {
      throw new AppError("ValidationError", 400, "Transaction not found or not confirmed", true);
    }

    const submission = await submissionRepo.findById(submissionId);
    if (!submission) throw new AppError("NotFound", 404, "Submission not found", true);

    // Update winning submission
    await submissionRepo.update(submissionId, { status: "accepted", paymentTxId: txId });

    // Reject all other submissions
    await submissionRepo.rejectAllExcept(bountyId, submissionId);

    // Update bounty status
    await bountyRepo.update(bountyId, {
      status: "accepted",
      winnerSubmissionId: submissionId as unknown as import("mongoose").Types.ObjectId,
    });

    // Update winner's totalEarnings
    const winner = await userRepo.findByWallet(submission.sellerWalletAddress);
    if (winner) {
      await userRepo.update(winner._id!.toString(), {
        totalEarnings: (winner.totalEarnings || 0) + bounty.rewardUSDC,
      });
    }

    // Generate download URL for the winning submission's full data
    const downloadUrl = getSignedUrl(submission.fullDataIpfsCid);

    return returnDataObj({ txId, downloadUrl, submission });
  }

  async initiateRefund(userId: string, bountyId: string) {
    const bounty = await bountyRepo.findById(bountyId);
    if (!bounty) throw new AppError("NotFound", 404, "Bounty not found", true);
    if (bounty.buyerId.toString() !== userId) {
      throw new AppError("AuthError", 403, "Only the bounty poster can refund", true);
    }
    if (bounty.status !== "open") throw new AppError("ValidationError", 400, "Bounty is not open", true);
    if (new Date() <= bounty.deadline) {
      throw new AppError("ValidationError", 400, "Cannot refund before deadline has passed", true);
    }

    const unsignedTxnBase64 = await buildRefundBountyTxn(
      bounty.buyerWalletAddress,
      bounty.contractBountyId
    );

    return returnDataObj({ unsignedTxnBase64 });
  }

  async confirmRefund(userId: string, bountyId: string, txId: string) {
    const bounty = await bountyRepo.findById(bountyId);
    if (!bounty) throw new AppError("NotFound", 404, "Bounty not found", true);
    if (bounty.buyerId.toString() !== userId) {
      throw new AppError("AuthError", 403, "Only the bounty poster can confirm refund", true);
    }

    try {
      await verifyTransaction(txId);
    } catch {
      throw new AppError("ValidationError", 400, "Transaction not found", true);
    }

    await bountyRepo.update(bountyId, { status: "cancelled" });

    return returnDataObj({ success: true });
  }
}
