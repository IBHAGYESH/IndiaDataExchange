const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001",
  algorandNetwork: process.env.NEXT_PUBLIC_ALGORAND_NETWORK || "testnet",
  usdcAssetId: Number(process.env.NEXT_PUBLIC_USDC_ASSET_ID) || 10458941,
  pinataGateway:
    process.env.NEXT_PUBLIC_PINATA_GATEWAY ||
    "https://gateway.pinata.cloud/ipfs",
  algoExplorerTxUrl: "https://lora.algokit.io/testnet/transaction",
  /** DPDP / GDPR grievance and data-request contact (shown on Privacy Policy) */
  privacyContactEmail:
    process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL || "privacy@example.com",
  /** Dataset abuse / takedown reports */
  reportEmail:
    process.env.NEXT_PUBLIC_REPORT_EMAIL ||
    process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL ||
    "privacy@example.com",
};

export default config;
