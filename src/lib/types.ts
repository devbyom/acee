/** Shared domain types for Ace's private application layer. */

export type TxType = "payment" | "prediction";

export type TxStatus = "pending" | "batched" | "submitted" | "confirmed";

export interface Transaction {
  id: string;
  type: TxType;
  sender: string;
  recipient?: string;
  marketId?: string;
  outcome?: string;
  amount: string;
  asset: string;
  timestamp: number;
  status: TxStatus;
  // Populated once the transaction's batch is committed on Monad.
  batchId?: number;
  // For predictions: the public external-market execution record (if any).
  execution?: ExecutionRecord;
  // For on-chain escrow payments:
  claimed?: boolean;
  onchainTxHash?: string;
  claimTxHash?: string;
}

export interface PredictionIntent {
  id: string;
  userAddress: string;
  marketProtocol: string;
  marketId: string;
  outcome: string;
  amount: string;
  status: string;
  // Whether this intent has already been executed (prevents duplicates).
  executed?: boolean;
  createdAt: number;
}

/** A public, on-chain (or clearly-labeled demo) execution record. */
export interface ExecutionRecord {
  // "onchain" = a real transaction was submitted to Monad / external protocol.
  // "demo"    = a simulated execution; NO real transaction hash exists.
  mode: "onchain" | "demo";
  protocol: string;
  marketId: string;
  outcome: string;
  amount: string;
  // Real tx hash — present ONLY when mode === "onchain".
  txHash?: string;
  // The public execution wallet (Ace executor) address, when applicable.
  executorAddress?: string;
  positionId?: string;
  note?: string;
  timestamp: number;
}

export interface Market {
  marketId: string;
  protocol: string;
  question: string;
  outcomes: string[];
  status: "OPEN" | "CLOSED" | "RESOLVED" | "UNAVAILABLE";
  currentData?: Record<string, unknown>;
  // True if this market data is a labeled demo, not a real external market read.
  isDemo?: boolean;
}

export interface Quote {
  marketId: string;
  outcome: string;
  amount: string;
  // Price in cents (e.g. 64 => 64¢), when available.
  priceCents?: number;
  isDemo?: boolean;
}

export interface Position {
  positionId: string;
  marketId: string;
  outcome: string;
  amount: string;
  status: string;
  isDemo?: boolean;
}

export interface ExecutionResult {
  mode: "onchain" | "demo";
  txHash?: string;
  positionId?: string;
  executorAddress?: string;
  note?: string;
}

export interface BatchResult {
  batchId: number;
  merkleRoot: string;
  transactionHashes: string[];
  transactionIds: string[];
  total: string;
}
