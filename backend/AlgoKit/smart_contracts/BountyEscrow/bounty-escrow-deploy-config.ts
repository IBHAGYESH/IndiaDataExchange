import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";

// After compiling, the generated client will be at:
// ../artifacts/BountyEscrow/BountyEscrowClient
// For now, provide manual deploy via algosdk since artifacts don't exist yet

const USDC_ASA_ID = 10458941; // Testnet USDC

export async function deploy() {
  console.log("=== Deploying BountyEscrow Contract ===");

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  console.log("Deployer address:", deployer.addr);

  // After running `algokit compile ts smart_contracts` and `algokit generate client`,
  // use the generated factory:
  //
  // import { BountyEscrowFactory } from "../artifacts/BountyEscrow/BountyEscrowClient";
  // const factory = algorand.client.getTypedAppFactory(BountyEscrowFactory, {
  //   defaultSender: deployer.addr,
  // });
  // const { appClient, result } = await factory.deploy({
  //   onUpdate: "append",
  //   onSchemaBreak: "append",
  // });
  //
  // if (["create", "replace"].includes(result.operationPerformed)) {
  //   // Fund with ALGO for MBR (box storage: ~0.5 ALGO per box + base 0.2 ALGO)
  //   await algorand.send.payment({
  //     amount: (2).algo(),
  //     sender: deployer.addr,
  //     receiver: appClient.appAddress,
  //   });
  //
  //   // Opt contract into USDC ASA
  //   const algodClient = algorand.client.algod;
  //   const suggestedParams = await algodClient.getTransactionParams().do();
  //   const appAddress = appClient.appAddress;
  //   // App will opt-in itself via the first postBounty call's inner txn
  //   console.log("Contract deployed at app ID:", appClient.appClient.appId);
  //   console.log("Contract address:", appAddress);
  //   console.log("Set BOUNTY_CONTRACT_APP_ID=" + appClient.appClient.appId + " in .env");
  // }

  console.log("Run: algokit compile ts smart_contracts && algokit generate client");
  console.log("Then uncomment the deploy code above.");
}

deploy().catch(console.error);
