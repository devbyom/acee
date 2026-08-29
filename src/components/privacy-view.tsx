"use client";

import { ArrowDown, Lock, Globe, Check } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shortHash } from "@/lib/utils";
import { explorerTx } from "@/lib/chain";

/**
 * Shows the honest private vs public split for a single transaction.
 *  - Private View: what lives in Ace's private ledger.
 *  - Public View: only what is actually on-chain on Monad.
 */
export function PrivacyView({ tx }: { tx: Transaction }) {
  const isPayment = tx.type === "payment";
  const onChainTxHash =
    tx.execution?.mode === "onchain" ? tx.execution.txHash : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Private View */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-violet-300" />
          <span className="text-sm font-medium text-violet-200">Private View</span>
          <Badge variant="private">Ace ledger</Badge>
        </div>

        {isPayment ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <span className="text-xs text-muted-foreground">You</span>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {tx.amount} {tx.asset}
            </span>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <span className="mono text-xs text-muted-foreground">
              {shortHash(tx.recipient)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <span className="text-xs text-muted-foreground">You</span>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {tx.outcome} · {tx.amount} {tx.asset}
            </span>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <span className="mono text-xs text-muted-foreground">
              intent → Ace executor
            </span>
          </div>
        )}

        <Separator className="my-3" />
        <p className="text-xs text-muted-foreground">
          Stored in Ace&apos;s private ledger. Not individually published on-chain.
        </p>
      </div>

      {/* Public View */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-300" />
          <span className="text-sm font-medium text-sky-200">Public View</span>
          <Badge variant="secondary">Monad</Badge>
        </div>

        {isPayment ? (
          <PublicBatch tx={tx} />
        ) : (
          <PublicPrediction tx={tx} onChainTxHash={onChainTxHash} />
        )}
      </div>
    </div>
  );
}

function PublicBatch({ tx }: { tx: Transaction }) {
  if (tx.batchId && (tx.status === "confirmed" || tx.status === "batched")) {
    return (
      <div className="space-y-2">
        <div className="text-sm">
          Ace Batch <span className="mono">#{tx.batchId}</span>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Commitment
          </div>
          <div className="mono text-xs break-all text-foreground/80">
            Merkle root committed on Monad
          </div>
        </div>
        {tx.status === "confirmed" && (
          <div className="flex items-center gap-1 text-success">
            <Check className="h-3.5 w-3.5" /> <span className="text-xs">Confirmed</span>
          </div>
        )}
      </div>
    );
  }
  return (
    <p className="text-xs text-muted-foreground">
      Nothing on-chain yet. This payment is pending private settlement. Once
      batched, only the Merkle commitment (not this payment) appears on Monad.
    </p>
  );
}

function PublicPrediction({
  tx,
  onChainTxHash,
}: {
  tx: Transaction;
  onChainTxHash?: string;
}) {
  if (tx.execution?.mode === "demo") {
    return (
      <div className="space-y-2">
        <Badge variant="warning">DEMO — NOT AN ON-CHAIN BET</Badge>
        <p className="text-xs text-muted-foreground">
          No real transaction was submitted. Configure a verified external
          market to execute a live bet.
        </p>
      </div>
    );
  }
  if (onChainTxHash) {
    return (
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          External execution (public)
        </div>
        <a
          href={explorerTx(onChainTxHash)}
          target="_blank"
          rel="noreferrer"
          className="mono text-xs text-sky-300 underline break-all"
        >
          {shortHash(onChainTxHash, 10, 8)}
        </a>
        <p className="text-xs text-muted-foreground">
          The external protocol&apos;s execution wallet (Ace executor) may remain
          publicly visible on-chain.
        </p>
      </div>
    );
  }
  return (
    <p className="text-xs text-muted-foreground">No public execution record yet.</p>
  );
}
