export type PurchaseProposal = {
  datasetId: string;
  title: string;
  priceUSDC: number;
  publicUrl: string;
  category?: string;
};

export type SsePayload =
  | { type: "step"; step: string; detail?: string }
  | { type: "thread"; threadId: string }
  | {
      type: "pending_confirmation";
      threadId: string;
      proposal: PurchaseProposal;
    }
  | { type: "message"; role: "assistant"; content: string }
  | { type: "error"; message: string }
  | { type: "done"; threadId: string; awaitingConfirmation?: boolean };

export type EmitFn = (payload: SsePayload) => void;

export interface DatasetSummary {
  _id: string;
  title?: string;
  description?: string;
  category?: string;
  priceUSDC?: number;
  fileName?: string;
}

/** IDE download endpoint returns { downloadUrl, fileName, expiresAt } — no `success` flag (same as marketplace client). */
export interface DownloadSuccessBody {
  downloadUrl?: string;
  fileName?: string;
  expiresAt?: number;
  success?: boolean;
  message?: string;
}
