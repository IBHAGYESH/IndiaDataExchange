/**
 * Seed script — creates demo users, datasets, and bounties
 * Usage: npm run seed
 * Note: This creates records directly in MongoDB for demo purposes.
 * File CIDs used here are placeholder CIDs (not real IPFS files).
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import mongoose from "mongoose";
import { appConfig } from "@/config";
import { UserModel } from "@components/user/database/models";
import { DatasetModel } from "@components/dataset/database/models";
import { BountyModel } from "@components/bounty/database/models";
import { SubmissionModel } from "@components/submission/database/models";
import { PurchaseModel } from "@components/purchase/database/models";

const DEMO_SELLER = "ALICE4DEMO2WALLET3ADDRESS4ALGORAND5TESTNET6789012345678901234";
const DEMO_BUYER = "BOB4BUYER2WALLET3ADDRESS4ALGORAND5TESTNET6789012345678901234";
const DEMO_HUNTER = "CHARLIE4HUNTER2WALLET3ADDRESS4ALGORAND5TESTNET6789012345678";
const DEMO_ADMIN = "ADMIN4WALLET2ADDRESS3ALGORAND4TESTNET5678901234567890123456789";

const PLACEHOLDER_CID = "bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354";
const PLACEHOLDER_SAMPLE_CID = "bafkreihdwdcefgh4d6bwsufqdf3smv6klcw3gofszvwlyarci47bgf111";

async function seedDatabase() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(appConfig.db.uri);
  console.log("Connected!");

  // Clear existing demo data
  await Promise.all([
    UserModel.deleteMany({}),
    DatasetModel.deleteMany({}),
    BountyModel.deleteMany({}),
    SubmissionModel.deleteMany({}),
    PurchaseModel.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  // Create Users
  const [adminUser, seller, buyer, hunter] = await Promise.all([
    UserModel.create({
      walletAddress: DEMO_ADMIN,
      isAdmin: true,
      isUSDCOptedIn: true,
      consentGivenAt: new Date(),
    }),
    UserModel.create({
      walletAddress: DEMO_SELLER,
      isAdmin: false,
      isUSDCOptedIn: true,
      totalEarnings: 45.5,
      consentGivenAt: new Date(),
    }),
    UserModel.create({
      walletAddress: DEMO_BUYER,
      isAdmin: false,
      isUSDCOptedIn: true,
      totalSpent: 87.0,
      consentGivenAt: new Date(),
    }),
    UserModel.create({
      walletAddress: DEMO_HUNTER,
      isAdmin: false,
      isUSDCOptedIn: true,
      totalEarnings: 120.0,
      consentGivenAt: new Date(),
    }),
  ]);
  console.log("Created 4 demo users");

  // Create Datasets
  const datasets = await DatasetModel.insertMany([
    {
      sellerId: seller._id,
      sellerWalletAddress: DEMO_SELLER,
      title: "Maharashtra Wheat Crop Disease Images 2024",
      description: "10,000+ high-resolution images of wheat crops across Maharashtra showing 12 disease types. Each image labeled with disease type, severity, location, and date. Ideal for training plant disease detection models.",
      category: "agriculture",
      tags: ["wheat", "disease-detection", "Maharashtra", "crop", "labeled"],
      priceUSDC: 15,
      sampleIpfsCid: PLACEHOLDER_SAMPLE_CID,
      sampleFileName: "wheat_sample_100.zip",
      fullDataIpfsCid: PLACEHOLDER_CID,
      fullDataFileName: "wheat_disease_10k_images.zip",
      format: "images",
      recordCount: 10000,
      sizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
      totalPurchases: 12,
      status: "active",
    },
    {
      sellerId: seller._id,
      sellerWalletAddress: DEMO_SELLER,
      title: "Karnataka Rice Yield vs Weather Correlation 2020-2024",
      description: "Historical rice yield data from 200 farms across Karnataka districts, correlated with hyperlocal weather data (temperature, rainfall, humidity). CSV format, ready for ML training.",
      category: "agriculture",
      tags: ["rice", "yield", "weather", "Karnataka", "time-series"],
      priceUSDC: 8.5,
      sampleIpfsCid: PLACEHOLDER_SAMPLE_CID,
      sampleFileName: "karnataka_rice_sample.csv",
      fullDataIpfsCid: PLACEHOLDER_CID,
      fullDataFileName: "karnataka_rice_yield_weather_2020_2024.csv",
      format: "csv",
      recordCount: 18000,
      sizeBytes: 45 * 1024 * 1024,
      totalPurchases: 28,
      status: "active",
    },
    {
      sellerId: hunter._id,
      sellerWalletAddress: DEMO_HUNTER,
      title: "Marathi-Hindi Code-Switching Speech Dataset",
      description: "2,000 hours of transcribed Marathi-Hindi code-switching speech recorded in Pune markets, offices, and homes. Includes speaker metadata (age, gender, education level). Perfect for code-switching ASR models.",
      category: "language",
      tags: ["Marathi", "Hindi", "code-switching", "ASR", "speech"],
      priceUSDC: 50,
      sampleIpfsCid: PLACEHOLDER_SAMPLE_CID,
      sampleFileName: "codeswitching_sample_30min.zip",
      fullDataIpfsCid: PLACEHOLDER_CID,
      fullDataFileName: "marathi_hindi_code_switching_2000h.zip",
      format: "audio",
      recordCount: 200000,
      sizeBytes: 80 * 1024 * 1024 * 1024, // 80GB
      totalPurchases: 5,
      status: "active",
    },
    {
      sellerId: buyer._id,
      sellerWalletAddress: DEMO_BUYER,
      title: "Bengaluru Traffic Flow at 50 Major Intersections",
      description: "3 months of traffic flow data at 50 major intersections in Bengaluru. Includes vehicle count (by type), speed, density, time of day. Great for urban mobility and signal optimization models.",
      category: "traffic",
      tags: ["Bengaluru", "traffic", "urban", "intersection", "mobility"],
      priceUSDC: 12,
      sampleIpfsCid: PLACEHOLDER_SAMPLE_CID,
      sampleFileName: "bengaluru_traffic_sample.json",
      fullDataIpfsCid: PLACEHOLDER_CID,
      fullDataFileName: "bengaluru_traffic_50intersections_q1_2024.json",
      format: "json",
      recordCount: 450000,
      sizeBytes: 280 * 1024 * 1024,
      totalPurchases: 19,
      status: "active",
    },
    {
      sellerId: hunter._id,
      sellerWalletAddress: DEMO_HUNTER,
      title: "Tamil Nadu Medicinal Plant Classification Dataset",
      description: "15,000 labeled images of 150 medicinal plant species found in Tamil Nadu, with regional names in Tamil and English. GPS coordinates included. Useful for Ayurvedic plant identification apps.",
      category: "healthcare",
      tags: ["Ayurveda", "medicinal-plants", "Tamil Nadu", "classification", "healthcare"],
      priceUSDC: 7,
      sampleIpfsCid: PLACEHOLDER_SAMPLE_CID,
      sampleFileName: "medicinal_plants_sample.zip",
      fullDataIpfsCid: PLACEHOLDER_CID,
      fullDataFileName: "tn_medicinal_plants_15k.zip",
      format: "images",
      recordCount: 15000,
      sizeBytes: 3.5 * 1024 * 1024 * 1024,
      totalPurchases: 8,
      status: "active",
    },
  ]);
  console.log(`Created ${datasets.length} demo datasets`);

  // Create Bounties
  const deadline30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const deadline7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const deadline60d = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const bounties = await BountyModel.insertMany([
    {
      buyerId: buyer._id,
      buyerWalletAddress: DEMO_BUYER,
      title: "Tamil-English Bilingual Conversation Dataset",
      description: "Need 500+ hours of Tamil-English bilingual conversations (not just Tamil or just English, but genuine code-switching). Should include: daily topics, business settings, family conversations. Transcriptions in both scripts required. Must be from Tamil Nadu (Coimbatore/Chennai preferred).",
      category: "language",
      tags: ["Tamil", "English", "bilingual", "transcription", "ASR"],
      rewardUSDC: 200,
      deadline: deadline30d,
      escrowTxId: "FAKE_ESCROW_TX_ID_123",
      contractBountyId: "bounty001demo",
      status: "open",
      submissionCount: 1,
    },
    {
      buyerId: buyer._id,
      buyerWalletAddress: DEMO_BUYER,
      title: "Delhi NCR Air Quality vs Hospital Admissions Correlation",
      description: "Seeking paired dataset: hourly AQI readings from 20+ Delhi NCR stations (2019-2023) matched with hospital admission data (respiratory diseases). Both datasets must be from same time range. Hospital data can be anonymized. Looking for usable CSV/JSON format.",
      category: "healthcare",
      tags: ["air-quality", "AQI", "Delhi", "healthcare", "respiratory"],
      rewardUSDC: 75,
      deadline: deadline7d,
      escrowTxId: "FAKE_ESCROW_TX_ID_456",
      contractBountyId: "bounty002demo",
      status: "open",
      submissionCount: 0,
    },
    {
      buyerId: adminUser._id,
      buyerWalletAddress: DEMO_ADMIN,
      title: "Kerala Monsoon Rainfall vs Agricultural Yield 50 Years",
      description: "50-year historical dataset of Kerala monsoon rainfall (district-level, monthly) correlated with major crop yields (rice, rubber, coconut, banana). Government data sources accepted. Needs to be clean and analysis-ready.",
      category: "agriculture",
      tags: ["Kerala", "monsoon", "rainfall", "yield", "historical"],
      rewardUSDC: 500,
      deadline: deadline60d,
      escrowTxId: "FAKE_ESCROW_TX_ID_789",
      contractBountyId: "bounty003demo",
      status: "open",
      submissionCount: 2,
    },
  ]);
  console.log(`Created ${bounties.length} demo bounties`);

  // Create a demo submission for the Tamil bilingual bounty
  await SubmissionModel.create({
    bountyId: bounties[0]._id,
    sellerId: hunter._id,
    sellerWalletAddress: DEMO_HUNTER,
    title: "Chennai Tamil-English Code Switching — 200 Hours",
    description: "200 hours of authentic Tamil-English code-switching conversations recorded in Chennai. Includes IT office, family, market, and rickshaw driver conversations. Fully transcribed in both Tamil script and English. 85% transcription accuracy validated.",
    sampleIpfsCid: PLACEHOLDER_SAMPLE_CID,
    sampleFileName: "chennai_bilingual_sample_30min.zip",
    fullDataIpfsCid: PLACEHOLDER_CID,
    fullDataFileName: "chennai_bilingual_200h.zip",
    status: "pending",
  });

  // Update bounty submission count
  await BountyModel.findByIdAndUpdate(bounties[0]._id, { submissionCount: 1 });

  // Create a demo purchase
  await PurchaseModel.create({
    buyerWalletAddress: DEMO_BUYER,
    buyerId: buyer._id,
    datasetId: datasets[0]._id,
    paymentTxId: "DEMO_PAYMENT_TX_12345678901234567890",
    amountPaidUSDC: 15,
    downloadCount: 2,
    lastDownloadAt: new Date(),
    isHuman: true,
  });

  console.log("Created demo submission and purchase");

  await mongoose.disconnect();
  console.log("\n✅ Seed complete!");
  console.log(`\nDemo Wallets:`);
  console.log(`  Admin:   ${DEMO_ADMIN}`);
  console.log(`  Seller:  ${DEMO_SELLER}`);
  console.log(`  Buyer:   ${DEMO_BUYER}`);
  console.log(`  Hunter:  ${DEMO_HUNTER}`);
  console.log(`\nCounts:`);
  console.log(`  Users:    4`);
  console.log(`  Datasets: ${datasets.length}`);
  console.log(`  Bounties: ${bounties.length}`);
}

seedDatabase().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
