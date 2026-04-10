import { UsersTable } from "@database/collection-names";
import { model, Schema } from "mongoose";

export interface IUser {
  _id?: string;
  walletAddress: string;
  name: string;
  bio: string;
  isUSDCOptedIn: boolean;
  isAdmin: boolean;
  totalEarnings: number;
  totalSpent: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    bio: { type: String, default: "" },
    isUSDCOptedIn: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    totalEarnings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>(UsersTable, UserSchema, UsersTable);
