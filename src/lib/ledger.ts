import { randomBytes } from "crypto";
import type {
  Transaction,
  PredictionIntent,
  TxStatus,
  ExecutionRecord,
} from "./types";

/**
 * Minimal in-memory private ledger.
 *
 * For the MVP this is process-memory only (acceptable per spec; no filesystem
 * dependency so it works on Vercel serverless too). It is intentionally NOT a
 * database — the private application state lives here, and only the Merkle
 * commitment ever reaches the public Monad settlement layer.
 *
 * We stash the store on globalThis so it survives Next.js hot-reload / route
 * module re-evaluation within a single server instance.
 */
interface LedgerStore {
  transactions: Map<string, Transaction>;
  intents: Map<string, PredictionIntent>;
  batchCounter: number;
}

const globalForLedger = globalThis as unknown as {
  __aceLedger?: LedgerStore;
};

function store(): LedgerStore {
  if (!globalForLedger.__aceLedger) {
    globalForLedger.__aceLedger = {
      transactions: new Map(),
      intents: new Map(),
      batchCounter: 41, // so the first settled batch is #42 (matches spec examples)
    };
    seedDemoData(globalForLedger.__aceLedger);
  }
  return globalForLedger.__aceLedger;
}

function genId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

// ---------- Payments / generic transactions ----------

export function createPayment(input: {
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
}): Transaction {
  const tx: Transaction = {
    id: genId("pay"),
    type: "payment",
    sender: input.sender.toLowerCase(),
    recipient: input.recipient,
    amount: input.amount,
    asset: input.asset,
    timestamp: Date.now(),
    status: "pending",
  };
  store().transactions.set(tx.id, tx);
  return tx;
}

export function recordPredictionTransaction(input: {
  sender: string;
  marketId: string;
  outcome: string;
  amount: string;
  asset: string;
  execution?: ExecutionRecord;
}): Transaction {
  const tx: Transaction = {
    id: genId("prd"),
    type: "prediction",
    sender: input.sender.toLowerCase(),
    marketId: input.marketId,
    outcome: input.outcome,
    amount: input.amount,
    asset: input.asset,
    timestamp: Date.now(),
    status: input.execution ? "submitted" : "pending",
    execution: input.execution,
  };
  store().transactions.set(tx.id, tx);
  return tx;
}

export function getTransaction(id: string): Transaction | undefined {
  return store().transactions.get(id);
}

export function listTransactions(userAddress?: string): Transaction[] {
  const all = Array.from(store().transactions.values());
  const filtered = userAddress
    ? all.filter(
        (t) =>
          t.sender === userAddress.toLowerCase() ||
          t.recipient?.toLowerCase() === userAddress.toLowerCase()
      )
    : all;
  return filtered.sort((a, b) => b.timestamp - a.timestamp);
}

export function listPending(type?: "payment" | "prediction"): Transaction[] {
  return Array.from(store().transactions.values()).filter(
    (t) => t.status === "pending" && (!type || t.type === type)
  );
}

export function setStatus(ids: string[], status: TxStatus, batchId?: number): void {
  const s = store();
  for (const id of ids) {
    const tx = s.transactions.get(id);
    if (tx) {
      tx.status = status;
      if (batchId !== undefined) tx.batchId = batchId;
      s.transactions.set(id, tx);
    }
  }
}

export function attachExecution(id: string, execution: ExecutionRecord): void {
  const tx = store().transactions.get(id);
  if (tx) {
    tx.execution = execution;
    tx.status = execution.mode === "onchain" ? "submitted" : tx.status;
    store().transactions.set(id, tx);
  }
}

// ---------- Prediction intents ----------

export function createIntent(input: {
  userAddress: string;
  marketProtocol: string;
  marketId: string;
  outcome: string;
  amount: string;
}): PredictionIntent {
  const intent: PredictionIntent = {
    id: genId("intent"),
    userAddress: input.userAddress.toLowerCase(),
    marketProtocol: input.marketProtocol,
    marketId: input.marketId,
    outcome: input.outcome,
    amount: input.amount,
    status: "pending",
    executed: false,
    createdAt: Date.now(),
  };
  store().intents.set(intent.id, intent);
  return intent;
}

export function getIntent(id: string): PredictionIntent | undefined {
  return store().intents.get(id);
}

export function markIntentExecuted(id: string, status = "executed"): void {
  const intent = store().intents.get(id);
  if (intent) {
    intent.executed = true;
    intent.status = status;
    store().intents.set(id, intent);
  }
}

// ---------- Batch counter ----------

export function nextBatchId(): number {
  const s = store();
  s.batchCounter += 1;
  return s.batchCounter;
}

export function peekNextBatchId(): number {
  return store().batchCounter + 1;
}

export function countSettledBatches(): number {
  // Distinct batchIds assigned to confirmed transactions.
  const ids = new Set<number>();
  for (const t of Array.from(store().transactions.values())) {
    if (t.batchId !== undefined && (t.status === "confirmed" || t.status === "batched")) {
      ids.add(t.batchId);
    }
  }
  return ids.size;
}

// ---------- Demo seed data (for a populated dashboard) ----------

function seedDemoData(s: LedgerStore) {
  const demoUser = "0x0000000000000000000000000000000000000000";
  const now = Date.now();
  const seeds: Transaction[] = [
    {
      id: "pay_seed01",
      type: "payment",
      sender: demoUser,
      recipient: "0x1111111111111111111111111111111111111111",
      amount: "10",
      asset: "USDC",
      timestamp: now - 1000 * 60 * 60 * 3,
      status: "confirmed",
      batchId: 41,
    },
    {
      id: "prd_seed01",
      type: "prediction",
      sender: demoUser,
      marketId: "demo-india-win",
      outcome: "YES",
      amount: "10",
      asset: "USDC",
      timestamp: now - 1000 * 60 * 60 * 2,
      status: "submitted",
    },
    {
      id: "prd_seed02",
      type: "prediction",
      sender: demoUser,
      marketId: "demo-btc-100k",
      outcome: "YES",
      amount: "5",
      asset: "USDC",
      timestamp: now - 1000 * 60 * 60,
      status: "submitted",
    },
  ];
  for (const t of seeds) s.transactions.set(t.id, t);
}
