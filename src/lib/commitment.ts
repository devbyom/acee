import { keccak256, toBytes, toHex, concatHex } from "viem";
import type { Transaction, BatchResult } from "./types";

/**
 * Build the canonical string for a private transaction:
 *   type|sender|recipient|marketId|outcome|amount|timestamp|id
 * Missing optional fields become empty strings so ordering is stable.
 */
export function canonicalString(tx: Transaction): string {
  return [
    tx.type,
    tx.sender,
    tx.recipient ?? "",
    tx.marketId ?? "",
    tx.outcome ?? "",
    tx.amount,
    String(tx.timestamp),
    tx.id,
  ].join("|");
}

/** keccak256 hash of the canonical transaction string. */
export function hashTransaction(tx: Transaction): `0x${string}` {
  return keccak256(toBytes(canonicalString(tx)));
}

/**
 * Hash a pair of nodes for the Merkle tree. Sorted-pair hashing makes the tree
 * order-independent at the pair level and matches common OpenZeppelin-style
 * verification, but we still feed leaves in a deterministic order (see below).
 */
function hashPair(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  const [left, right] = a.toLowerCase() <= b.toLowerCase() ? [a, b] : [b, a];
  return keccak256(concatHex([left, right]));
}

/**
 * Compute a Merkle root from an ordered list of leaf hashes.
 * If the level has an odd count, the last node is promoted (duplicated).
 * Deterministic: the same leaves in the same order always yield the same root.
 */
export function computeMerkleRoot(leaves: `0x${string}`[]): `0x${string}` {
  if (leaves.length === 0) {
    // Empty batch -> hash of empty bytes, a well-defined non-zero constant.
    return keccak256(toBytes(""));
  }
  let level = [...leaves];
  while (level.length > 1) {
    const next: `0x${string}`[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        next.push(hashPair(level[i], level[i + 1]));
      } else {
        next.push(level[i]); // promote odd node
      }
    }
    level = next;
  }
  return level[0];
}

/**
 * Build a batch commitment from a set of transactions.
 *
 * Deterministic ordering: transactions are sorted by their leaf hash before
 * building the tree, so the same transaction *set* always produces the same
 * root regardless of insertion order.
 *
 * Returns transactionHashes[], merkleRoot, batchId, and the total amount.
 */
export function buildBatch(txs: Transaction[], batchId: number): BatchResult {
  const withHashes = txs.map((tx) => ({ tx, hash: hashTransaction(tx) }));
  withHashes.sort((a, b) => (a.hash.toLowerCase() < b.hash.toLowerCase() ? -1 : 1));

  const leaves = withHashes.map((x) => x.hash);
  const merkleRoot = computeMerkleRoot(leaves);
  const total = txs
    .reduce((sum, tx) => sum + Number(tx.amount || "0"), 0)
    .toString();

  return {
    batchId,
    merkleRoot,
    transactionHashes: leaves,
    transactionIds: withHashes.map((x) => x.tx.id),
    total,
  };
}

/** Convenience: a bytes32 hex from any string (used for on-chain paymentId). */
export function toBytes32Id(value: string): `0x${string}` {
  return keccak256(toBytes(value));
}

export { toHex };
