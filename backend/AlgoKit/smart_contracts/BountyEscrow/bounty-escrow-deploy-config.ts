import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { BountyEscrowFactory } from "../artifacts/BountyEscrow/BountyEscrowClient";

export async function deploy() {
  console.log("=== Deploying BountyEscrow Contract ===");

  const algorand = AlgorandClient.fromEnvironment();
  const deployer = await algorand.account.fromEnvironment("DEPLOYER");

  const factory = algorand.client.getTypedAppFactory(BountyEscrowFactory, {
    defaultSender: deployer.addr,
  });

  const { appClient, result } = await factory.deploy({
    onUpdate: "append",
    onSchemaBreak: "append",
  });

  if (["create", "replace"].includes(result.operationPerformed)) {
    // Fund with ALGO for MBR (box storage: ~0.5 ALGO per box + base 0.2 ALGO)
    await algorand.send.payment({
      amount: (2).algo(),
      sender: deployer.addr,
      receiver: appClient.appAddress,
    });

    // Opt contract into USDC ASA so it can receive USDC transfers
    await appClient.send.optInToUsdc({
      args: {},
      extraFee: (1000).microAlgo(),
    });
  }
}

deploy().catch(console.error);
