const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001",
  algorandNetwork: process.env.NEXT_PUBLIC_ALGORAND_NETWORK || "testnet",
  usdcAssetId: Number(process.env.NEXT_PUBLIC_USDC_ASSET_ID) || 10458941,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs",
  algoExplorerTxUrl: "https://testnet.algoexplorer.io/tx",
};

export default config;
