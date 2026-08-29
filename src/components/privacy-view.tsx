"use client";

import { ArrowDown, Lock, Globe, ShieldCheck, Hash } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shortHash } from "@/lib/utils";
import { explorerTx } from "@/lib/chain";

export function PrivacyView({ tx }: { tx: Transaction }) {
  const isPayment = tx.type === "payment";
  const onChainTxHash =
    tx.execution?.mode === "onchain" ? tx.execution.txHash : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-2 pt-1">
      {/* Private View */}
      <div className="border border-[#298dff]/30 bg-[#298dff]/[0.03] p-4 flex flex-col justify-between" style={{ borderRadius: "2px" }}>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-[#298dff]" />
              <span className="text-xs font-semibold text-[#54a6ff]">Ace Confidential State</span>
            </div>
            <Badge variant="default" className="text-[10px]">Private Off-Chain</Badge>
          </div>

          {isPayment ? (
            <div className="flex flex-col items-center gap-1.5 py-3 text-center bg-[#000000] border border-[#1c2026]" style={{ borderRadius: "2px" }}>
              <span className="text-[11px] text-text-secondary">Sender (You)</span>
              <ArrowDown className="h-3 w-3 text-[#298dff]" />
              <span className="text-base font-bold mono text-[#54a6ff]">
                {tx.amount} {tx.asset}
              </span>
              <ArrowDown className="h-3 w-3 text-[#298dff]" />
              <span className="mono text-xs text-text-primary bg-[#0d0f12] px-2 py-0.5 border border-[#1c2026]">
                {shortHash(tx.recipient, 8, 6)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-3 text-center bg-[#000000] border border-[#1c2026]" style={{ borderRadius: "2px" }}>
              <span className="text-[11px] text-text-secondary">Position Intent</span>
              <ArrowDown className="h-3 w-3 text-[#298dff]" />
              <span className="text-sm font-bold text-text-primary">
                {tx.outcome} · {tx.amount} {tx.asset}
              </span>
              <ArrowDown className="h-3 w-3 text-[#298dff]" />
              <span className="mono text-xs text-[#54a6ff] bg-[#0d0f12] px-2 py-0.5 border border-[#1c2026]">
                Market: {shortHash(tx.marketId, 8, 6)}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3">
          <Separator className="my-2 bg-[#1c2026]" />
          <p className="text-[10px] text-text-secondary flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#298dff] shrink-0" />
            <span>Off-chain stealth state. Zero on-chain metadata leakage.</span>
          </p>
        </div>
      </div>

      {/* Public View */}
      <div className="border border-[#1c2026] bg-[#0d0f12] p-4 flex flex-col justify-between" style={{ borderRadius: "2px" }}>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-xs font-semibold text-text-primary">Public Monad Layer</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">Monad L1</Badge>
          </div>

          <div className="bg-[#000000] border border-[#1c2026] p-3" style={{ borderRadius: "2px" }}>
            {isPayment ? (
              <PublicBatch tx={tx} />
            ) : (
              <PublicPrediction tx={tx} onChainTxHash={onChainTxHash} />
            )}
          </div>
        </div>

        <div className="pt-3">
          <Separator className="my-2 bg-[#1c2026]" />
          <p className="text-[10px] text-text-muted flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span>Only Merkle tree roots are published on Monad.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function PublicBatch({ tx }: { tx: Transaction }) {
  if (tx.batchId && (tx.status === "confirmed" || tx.status === "batched")) {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Monad Batch</span>
          <span className="mono font-semibold text-[#54a6ff]">#{tx.batchId}</span>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
            Committed Root
          </div>
          <div className="mono text-[10px] break-all text-text-secondary bg-[#0d0f12] p-1.5 border border-[#1c2026]">
            0x7f9a...3b21
          </div>
        </div>
      </div>
    );
  }
  return (
    <p className="text-xs text-text-muted leading-relaxed">
      Pending batch rollup. Once settled, only the aggregated Merkle root will appear on Monad.
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
      <div className="space-y-1.5">
        <Badge variant="secondary">Demo Simulation</Badge>
        <p className="text-xs text-text-secondary leading-relaxed">
          Simulated order execution via relayer proxy.
        </p>
      </div>
    );
  }
  if (onChainTxHash) {
    return (
      <div className="space-y-1.5 text-xs">
        <div className="text-[10px] uppercase tracking-wider text-text-muted">
          Relayer Transaction
        </div>
        <a
          href={explorerTx(onChainTxHash)}
          target="_blank"
          rel="noreferrer"
          className="mono text-xs text-[#298dff] underline break-all block hover:text-[#54a6ff]"
        >
          {shortHash(onChainTxHash, 12, 8)}
        </a>
      </div>
    );
  }
  return (
    <p className="text-xs text-text-muted">No public execution hash recorded.</p>
  );
}
