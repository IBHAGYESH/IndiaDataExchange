import { BountiesTable } from "@database/collection-names";
import { Document, model, Schema, Types } from "mongoose";
import { DatasetCategory } from "@components/dataset/database/models";

export type BountyStatus = "open" | "accepted" | "cancelled" | "expired";

export interface IBounty {
  _id?: string;
  buyerId: Types.ObjectId;
  buyerWalletAddress: string;
  title: string;
  description: string;
  category: DatasetCategory;
  tags: string[];
  rewardUSDC: number;
  deadline: Date;
  escrowTxId: string;
  contractBountyId: string;
  status: BountyStatus;
  submissionCount: number;
  winnerSubmissionId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const BountySchema = new Schema<IBounty>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    buyerWalletAddress: { type: String, required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 3000 },
    category: {
      type: String,
      required: true,
      enum: ["agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"],
    },
    tags: [{ type: String }],
    rewardUSDC: { type: Number, required: true, min: 1, max: 1000 },
    deadline: { type: Date, required: true, index: true },
    escrowTxId: { type: String, default: "" },
    contractBountyId: { type: String, default: "" },
    status: {
      type: String,
      default: "open",
      enum: ["open", "accepted", "cancelled", "expired"],
      index: true,
    },
    submissionCount: { type: Number, default: 0 },
    winnerSubmissionId: { type: Schema.Types.ObjectId, ref: "submissions", default: null },
  },
  { timestamps: true }
);

export const BountyModel = model<IBounty & Document>(BountiesTable, BountySchema, BountiesTable);
