import { NoncesTable } from "@database/collection-names";
import { model, Schema } from "mongoose";

export interface INonce {
  _id?: string;
  walletAddress: string;
  nonce: string;
  expiresAt: Date;
  createdAt?: Date;
}

const NonceSchema = new Schema<INonce>(
  {
    walletAddress: { type: String, required: true, index: true },
    nonce: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const NonceModel = model<INonce>(NoncesTable, NonceSchema, NoncesTable);
