import { NextRequest, NextResponse } from "next/server";
import {
  listPending,
  nextBatchId,
  peekNextBatchId,
  setStatus,
} from "@/lib/ledger";
import { buildBatch } from "@/lib/commitment";
import { errorResponse } from "@/lib/api";
import {
  getExecutorWalletClient,
  getPublicClient,
  getExecutorAddress,
} from "@/lib/executor";
import { requireSettlementAddress } from "@/lib/env";
import { ACE_SETTLEMENT_ABI } from "@/lib/contracts";
import { ValidationError } from "@/lib/validation";
import { monadTestnet } from "@/lib/chain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/batches/settle
 * Preview the next pending batch: builds the Merkle root WITHOUT submitting.
 */
export async function GET() {
  try {
    const pending = listPending();
    const preview = buildBatch(pending, peekNextBatchId());
    return NextResponse.json({
      batchId: preview.batchId,
      count: pending.length,
      total: preview.total,
      merkleRoot: preview.merkleRoot,
      transactionHashes: preview.transactionHashes,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * POST /api/batches/settle
 *
 * Real on-chain settlement:
 *   1. collect pending private transactions
 *   2. hash them (canonical string -> keccak256)
 *   3. build a Merkle tree
 *   4. compute the root (the Ace commitment)
 *   5. submit commitBatch() to AceSettlement on Monad Testnet
 *   6. wait for the receipt, then update statuses
 *   7. return the real transaction hash
 *
 * We never fabricate a hash: the hash is only returned after submission and the
 * status only becomes "confirmed" after a successful on-chain receipt.
 */
export async function POST(_req: NextRequest) {
  try {
    const pending = listPending();
    if (pending.length === 0) {
      throw new ValidationError("No pending transactions to settle.");
    }

    const settlementAddress = requireSettlementAddress();
    const batchId = nextBatchId();
    const batch = buildBatch(pending, batchId);

    // Mark as batched before submission (private-state bookkeeping).
    setStatus(batch.transactionIds, "batched", batchId);

    const wallet = getExecutorWalletClient();
    const publicClient = getPublicClient();

    // Submit the commitment (Merkle root) to Monad.
    const hash = await wallet.writeContract({
      account: wallet.account!,
      chain: monadTestnet,
      address: settlementAddress,
      abi: ACE_SETTLEMENT_ABI,
      functionName: "commitBatch",
      args: [BigInt(batchId), batch.merkleRoot],
    });

    // Wait for a real receipt before claiming confirmation.
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      setStatus(batch.transactionIds, "confirmed", batchId);
    } else {
      // Revert bookkeeping to pending if the tx failed.
      setStatus(batch.transactionIds, "pending", batchId);
      throw new Error(`Settlement transaction reverted (hash: ${hash}).`);
    }

    return NextResponse.json({
      batchId,
      merkleRoot: batch.merkleRoot,
      transactionHashes: batch.transactionHashes,
      count: batch.transactionIds.length,
      total: batch.total,
      monadTxHash: hash,
      operator: getExecutorAddress(),
      status: "confirmed",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
