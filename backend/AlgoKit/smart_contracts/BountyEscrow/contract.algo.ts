import {
  Contract,
  abimethod,
  Global,
  Txn,
  itxn,
  Uint64,
  uint64,
  BoxMap,
  bytes,
  assert,
  arc4,
  clone,
  op,
} from "@algorandfoundation/algorand-typescript";

// USDC testnet ASA ID
const USDC_ASA_ID: uint64 = Uint64(10458941);

// BountyData struct stored per bounty in box storage
class BountyData extends arc4.Struct<{
  buyer: arc4.Address;       // Bounty poster's address
  amount: arc4.Uint64;       // USDC amount locked (in microUSDC)
  deadline: arc4.Uint64;     // Unix timestamp deadline
  status: arc4.Uint8;        // 0 = open, 1 = accepted, 2 = cancelled
}> {}

export class BountyEscrow extends Contract {
  // Box storage keyed by bountyId string (MongoDB ObjectId string)
  private bounties = BoxMap<bytes, BountyData>({ keyPrefix: "bounty_" });

  /**
   * Post a bounty and lock USDC in escrow.
   * Transaction group expected:
   *   [0] USDC transfer: Buyer → Contract (axfer)
   *   [1] App call: postBounty(bountyId, amount, deadline)
   */
  @abimethod()
  public postBounty(bountyId: string, amount: uint64, deadline: uint64): bytes {
    const bountyKey = new arc4.Str(bountyId).bytes;

    // Verify bounty does not already exist
    assert(!this.bounties(bountyKey).exists, "Bounty already exists");

    // Opt-in to USDC if not already (idempotent)
    itxn
      .assetTransfer({
        assetReceiver: Global.currentApplicationAddress,
        xferAsset: USDC_ASA_ID,
        assetAmount: 0,
        fee: 0,
      })
      .submit();

    // Store bounty data in box
    const bountyData = new BountyData({
      buyer: new arc4.Address(Txn.sender),
      amount: new arc4.Uint64(amount),
      deadline: new arc4.Uint64(deadline),
      status: new arc4.Uint8(0), // open
    });

    this.bounties(bountyKey).value = clone(bountyData);

    return Txn.txId;
  }

  /**
   * Accept a submission and release USDC to winner.
   * Caller must be the original bounty poster.
   * Uses 2 inner transactions: USDC transfer to winner + box deletion.
   * Fee must cover inner txn: fee = 3000 (1 app call + 2 inner)
   */
  @abimethod()
  public acceptSubmission(bountyId: string, winnerAddress: arc4.Address): bytes {
    const bountyKey = new arc4.Str(bountyId).bytes;

    assert(this.bounties(bountyKey).exists, "Bounty not found");

    const bountyData = clone(this.bounties(bountyKey).value);

    // Verify caller is the original buyer
    const callerAddr = new arc4.Address(Txn.sender);
    assert(bountyData.buyer.native === callerAddr.native, "Only bounty poster can accept");

    // Verify bounty is open
    assert(bountyData.status.asUint64() === Uint64(0), "Bounty is not open");

    // Transfer USDC to winner
    itxn
      .assetTransfer({
        assetReceiver: winnerAddress.native,
        xferAsset: USDC_ASA_ID,
        assetAmount: bountyData.amount.asUint64(),
        fee: 0,
      })
      .submit();

    // Delete box (cleanup and reclaim MBR)
    this.bounties(bountyKey).delete();

    return Txn.txId;
  }

  /**
   * Refund bounty USDC back to buyer.
   * Can only be called by buyer and only after deadline has passed.
   * Fee must cover inner txn: fee = 2000
   */
  @abimethod()
  public refundBounty(bountyId: string): bytes {
    const bountyKey = new arc4.Str(bountyId).bytes;

    assert(this.bounties(bountyKey).exists, "Bounty not found");

    const bountyData = clone(this.bounties(bountyKey).value);

    // Verify caller is the original buyer
    const callerAddr = new arc4.Address(Txn.sender);
    assert(bountyData.buyer.native === callerAddr.native, "Only bounty poster can refund");

    // Verify bounty is open
    assert(bountyData.status.asUint64() === Uint64(0), "Bounty is not open");

    // Verify deadline has passed
    const currentTime = Global.latestTimestamp;
    assert(currentTime >= bountyData.deadline.asUint64(), "Deadline has not passed yet");

    // Transfer USDC back to buyer
    itxn
      .assetTransfer({
        assetReceiver: Txn.sender,
        xferAsset: USDC_ASA_ID,
        assetAmount: bountyData.amount.asUint64(),
        fee: 0,
      })
      .submit();

    // Delete box
    this.bounties(bountyKey).delete();

    return Txn.txId;
  }

  /**
   * Read-only: get bounty escrow state.
   */
  @abimethod({ readonly: true })
  public getBountyEscrow(bountyId: string): BountyData {
    const bountyKey = new arc4.Str(bountyId).bytes;
    assert(this.bounties(bountyKey).exists, "Bounty not found");
    return clone(this.bounties(bountyKey).value);
  }

  /**
   * Fund the contract with ALGO for MBR (admin only).
   */
  @abimethod()
  public fundContract(): void {
    assert(Txn.sender === Global.creatorAddress, "Only creator can fund");
  }

  /**
   * Opt the contract into USDC ASA (admin only).
   * Call once after deployment so the contract can receive USDC.
   * Subsequent calls are harmless (0-amount self-transfer is a no-op if already opted in).
   */
  @abimethod()
  public optInToUSDC(): void {
    assert(Txn.sender === Global.creatorAddress, "Only creator can opt-in");
    itxn
      .assetTransfer({
        assetReceiver: Global.currentApplicationAddress,
        xferAsset: USDC_ASA_ID,
        assetAmount: 0,
        fee: 0,
      })
      .submit();
  }
}
