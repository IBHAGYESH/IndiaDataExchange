import { PurchasesTable } from "@database/collection-names";
import { model, Schema, Types } from "mongoose";

export interface IPurchase {
  _id?: string;
  buyerWalletAddress: string;
  buyerId?: Types.ObjectId;
  datasetId: Types.ObjectId;
  paymentTxId: string;
  amountPaidUSDC: number;
  downloadCount: number;
  lastDownloadAt?: Date;
  redownloadExpiresAt?: Date;
  isHuman: boolean;
  createdAt?: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    buyerWalletAddress: { type: String, required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "users", default: null },
    datasetId: { type: Schema.Types.ObjectId, ref: "datasets", required: true, index: true },
    paymentTxId: { type: String, required: true, unique: true },
    amountPaidUSDC: { type: Number, required: true },
    downloadCount: { type: Number, default: 0 },
    lastDownloadAt: { type: Date },
    redownloadExpiresAt: { type: Date, default: null },
    isHuman: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PurchaseSchema.index({ buyerWalletAddress: 1, datasetId: 1 });

export const PurchaseModel = model<IPurchase>(
  PurchasesTable,
  PurchaseSchema,
  PurchasesTable
);
