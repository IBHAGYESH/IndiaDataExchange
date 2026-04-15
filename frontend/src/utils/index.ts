import algosdk from "algosdk";

/** True when both strings are valid Algorand addresses for the same account (checksum-safe). */
export function sameAlgorandAddress(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  try {
    return (
      algosdk.encodeAddress(algosdk.decodeAddress(a).publicKey) ===
      algosdk.encodeAddress(algosdk.decodeAddress(b).publicKey)
    );
  } catch {
    return false;
  }
}

export const truncateAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatUSDC = (amount: number): string => {
  return `$${amount.toFixed(2)} USDC`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isDeadlinePassed = (deadline: string): boolean => {
  return new Date(deadline) < new Date();
};
