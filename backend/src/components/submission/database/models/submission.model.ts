import { SubmissionsTable } from "@database/collection-names";
import { model, Schema, Types } from "mongoose";
import type { DatasetFormat } from "@components/dataset/database/models/dataset.model";

export type SubmissionStatus = "pending" | "accepted" | "rejected";

export interface ISubmission {
  _id?: string;
  bountyId: Types.ObjectId;
  sellerId: Types.ObjectId;
  sellerWalletAddress: string;
  title: string;
  description: string;
  /** Same vocabulary as marketplace datasets (older rows may omit until backfilled). */
  format?: DatasetFormat;
  recordCount?: number;
  /** Byte size of the full dataset file at submission time */
  sizeBytes?: number;
  sampleIpfsCid: string;
  sampleFileName: string;
  fullDataIpfsCid: string;
  fullDataFileName: string;
  status: SubmissionStatus;
  paymentTxId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    bountyId: { type: Schema.Types.ObjectId, ref: "bounties", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    sellerWalletAddress: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 3000 },
    format: {
      type: String,
      enum: ["csv", "json", "images", "audio", "video", "pdf", "other"],
      default: "other",
    },
    recordCount: { type: Number, default: 0, min: 0 },
    sizeBytes: { type: Number, default: 0, min: 0 },
    sampleIpfsCid: { type: String, required: true },
    sampleFileName: { type: String, required: true },
    fullDataIpfsCid: { type: String, required: true },
    fullDataFileName: { type: String, required: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
    paymentTxId: { type: String, default: "" },
  },
  { timestamps: true }
);

export const SubmissionModel = model<ISubmission>(
  SubmissionsTable,
  SubmissionSchema,
  SubmissionsTable
);
