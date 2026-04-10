import { DatasetsTable } from "@database/collection-names";
import { model, Schema, Types } from "mongoose";

export type DatasetCategory =
  | "agriculture"
  | "language"
  | "traffic"
  | "healthcare"
  | "cultural"
  | "financial"
  | "other";

export type DatasetFormat =
  | "csv"
  | "json"
  | "images"
  | "audio"
  | "video"
  | "pdf"
  | "other";

export type DatasetStatus = "active" | "unlisted";

export interface IDataset {
  _id?: string;
  sellerId: Types.ObjectId;
  sellerWalletAddress: string;
  title: string;
  description: string;
  category: DatasetCategory;
  tags: string[];
  priceUSDC: number;
  sampleIpfsCid: string;
  sampleFileName: string;
  fullDataIpfsCid: string;
  fullDataFileName: string;
  format: DatasetFormat;
  recordCount: number;
  sizeBytes: number;
  totalPurchases: number;
  status: DatasetStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const DatasetSchema = new Schema<IDataset>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    sellerWalletAddress: { type: String, required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: ["agriculture", "language", "traffic", "healthcare", "cultural", "financial", "other"],
      index: true,
    },
    tags: [{ type: String }],
    priceUSDC: { type: Number, required: true, min: 0.1, max: 100 },
    sampleIpfsCid: { type: String, required: true },
    sampleFileName: { type: String, required: true },
    fullDataIpfsCid: { type: String, required: true },
    fullDataFileName: { type: String, required: true },
    format: {
      type: String,
      required: true,
      enum: ["csv", "json", "images", "audio", "video", "pdf", "other"],
    },
    recordCount: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    status: { type: String, default: "active", enum: ["active", "unlisted"], index: true },
  },
  { timestamps: true }
);

DatasetSchema.index({ title: "text", description: "text" });
DatasetSchema.index({ status: 1, category: 1 });

export const DatasetModel = model<IDataset>(DatasetsTable, DatasetSchema, DatasetsTable);
