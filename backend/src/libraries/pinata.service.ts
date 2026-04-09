import PinataSDK from "@pinata/sdk";
import { Readable } from "stream";
import { appConfig } from "@/config";

let pinataClient: PinataSDK | null = null;

function getPinata(): PinataSDK {
  if (!pinataClient) {
    pinataClient = new PinataSDK(appConfig.pinata.apiKey, appConfig.pinata.apiSecret);
  }
  return pinataClient;
}

export async function uploadPublicFile(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const pinata = getPinata();
  const stream = bufferToStream(fileBuffer);
  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: fileName },
    pinataOptions: { cidVersion: 1 },
  });
  return result.IpfsHash;
}

export async function uploadPrivateFile(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const pinata = getPinata();
  const stream = bufferToStream(fileBuffer);
  // Using standard pin — access is controlled by backend generating signed URLs
  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: `private_${fileName}` },
    pinataOptions: { cidVersion: 1 },
  });
  return result.IpfsHash;
}

export function getPublicGatewayUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

export function getSignedUrl(cid: string): string {
  const token = appConfig.pinata.gatewayToken;
  if (token) {
    return `https://gateway.pinata.cloud/ipfs/${cid}?pinataGatewayToken=${token}`;
  }
  // Fallback: dedicated gateway URL
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
