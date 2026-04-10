export interface User {
  _id: string;
  walletAddress: string;
  name: string;
  bio: string;
  isUSDCOptedIn: boolean;
  isAdmin: boolean;
  totalEarnings: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export type DatasetCategory =
  | "agriculture"
  | "language"
  | "traffic"
  | "healthcare"
  | "cultural"
  | "financial"
  | "other";

export type DatasetFormat = "csv" | "json" | "images" | "audio" | "video" | "pdf" | "other";

export interface Dataset {
  _id: string;
  sellerId: string;
  sellerWalletAddress: string;
  title: string;
  description: string;
  category: DatasetCategory;
  tags: string[];
  priceUSDC: number;
  sampleIpfsCid: string;
  sampleFileName: string;
  format: DatasetFormat;
  recordCount: number;
  sizeBytes: number;
  totalPurchases: number;
  status: "active" | "unlisted";
  createdAt: string;
  updatedAt: string;
}

/** Populated dataset on a purchase (no full-data IPFS fields). */
export type PurchasedDataset = Omit<Dataset, "sellerId"> & { sellerId?: string };

export interface Purchase {
  _id: string;
  paymentTxId: string;
  amountPaidUSDC: number;
  downloadCount: number;
  lastDownloadAt?: string;
  createdAt: string;
  downloadUrl?: string | null;
  datasetId: PurchasedDataset | null;
}

export type BountyStatus = "open" | "accepted" | "cancelled" | "expired";

export interface Bounty {
  _id: string;
  buyerId: string;
  buyerWalletAddress: string;
  title: string;
  description: string;
  category: DatasetCategory;
  tags: string[];
  rewardUSDC: number;
  deadline: string;
  escrowTxId: string;
  contractBountyId: string;
  status: BountyStatus;
  submissionCount: number;
  winnerSubmissionId?: string;
  createdAt: string;
  updatedAt: string;
  /** Present on GET /bounties/:id when viewer is not the buyer */
  hasSubmitted?: boolean;
}

export type SubmissionStatus = "pending" | "accepted" | "rejected";

export interface Submission {
  _id: string;
  bountyId: string;
  sellerId: string;
  sellerWalletAddress: string;
  title: string;
  description: string;
  sampleIpfsCid: string;
  sampleFileName: string;
  status: SubmissionStatus;
  paymentTxId?: string;
  createdAt: string;
  updatedAt: string;
  /** Signed URL for buyer after acceptance (from API, short-lived) */
  downloadUrl?: string;
}

export interface AuthState {
  walletAddress: string | null;
  jwt: string | null;
  user: User | null;
  isConnected: boolean;
  isOptedIn: boolean;
}
