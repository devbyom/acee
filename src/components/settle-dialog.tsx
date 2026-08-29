"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Boxes, ExternalLink, ArrowRight, Copy, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shortHash } from "@/lib/utils";
import { explorerTx, explorerAddress } from "@/lib/chain";
import { useAceConfig } from "@/lib/useAceConfig";
import { ACE_SETTLEMENT_ADDRESS, ACE_PAYMENT_ADDRESS } from "@/lib/contracts";

interface Preview {
  batchId: number;
  count: number;
  total: string;
  merkleRoot: string;
}

interface SettleResult {
  batchId: number;
  merkleRoot: string;
  count: number;
  total: string;
  monadTxHash: string;
  status: string;
}

export function SettleDialog({
  open,
  onOpenChange,
  onSettled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettled?: () => void;
}) {
  const { config } = useAceConfig();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SettleResult | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 1500);
  };

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setLoading(true);
    fetch("/api/batches/settle")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPreview(data);
      })
      .catch(() => setError("Failed to load pending batch"))
      .finally(() => setLoading(false));
  }, [open]);

  async function settle() {
    setError(null);
    setSettling(true);
    try {
      const res = await fetch("/api/batches/settle", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Settlement failed");
      setResult(data);
      onSettled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settlement failed");
    } finally {
      setSettling(false);
    }
  }

  function close() {
    onOpenChange(false);
  }

  const noExecutor = config && !config.executorConfigured;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close} className="max-w-xl">
        {!result ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
                  <Boxes className="h-3.5 w-3.5" />
                </div>
                <DialogTitle>Commit Batch to Monad</DialogTitle>
              </div>
              <DialogDescription>
                Constructs a deterministic Keccak-256 Merkle tree of confidential transactions and records the root commitment on-chain.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                <Loader2 className="h-6 w-6 animate-spin text-[#298dff]" />
                <span className="text-xs text-text-secondary">Hashing tree leaves...</span>
              </div>
            ) : preview ? (
              <div className="space-y-3.5 pt-1">
                {/* Batch details card */}
                <div className="border border-[#1c2026] bg-[#000000] p-4 space-y-3" style={{ borderRadius: "2px" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">Target Rollup</span>
                      <div className="text-sm font-medium text-text-primary">
                        BATCH <span className="mono text-[#54a6ff]">#{preview.batchId}</span>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[11px]">
                      {preview.count} Transaction{preview.count === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-[#1c2026] pt-2">
                    <span className="text-xs text-text-secondary">Batch Volume</span>
                    <span className="text-sm font-bold text-text-primary mono">${preview.total} USDC</span>
                  </div>

                  <div className="border-t border-[#1c2026] pt-2">
                    <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                      Merkle Root Proof
                    </div>
                    <div className="mono text-[11px] break-all bg-[#0d0f12] p-2 border border-[#1c2026] text-[#54a6ff]" style={{ borderRadius: "2px" }}>
                      {preview.merkleRoot}
                    </div>
                  </div>
                </div>

                {/* Verified Deployed Contracts */}
                <div className="border border-[#1c2026] bg-[#0d0f12] p-3.5 space-y-2 text-xs" style={{ borderRadius: "2px" }}>
                  <div className="flex items-center justify-between font-medium text-text-primary border-b border-[#1c2026] pb-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-[#54a6ff]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#298dff]" /> Verified Contracts (Monad Testnet)
                    </span>
                    <Badge variant="default" className="text-[9px]">Live</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-text-muted uppercase">AceSettlement (operator = executor)</div>
                      <span className="mono text-[11px] text-text-primary">{shortHash(ACE_SETTLEMENT_ADDRESS, 10, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copy(ACE_SETTLEMENT_ADDRESS, "settle")}
                        className="text-text-secondary hover:text-text-primary"
                        title="Copy Address"
                      >
                        {copiedContract === "settle" ? <Check className="h-3.5 w-3.5 text-[#298dff]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={explorerAddress(ACE_SETTLEMENT_ADDRESS)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#298dff] hover:text-[#54a6ff]"
                        title="View on MonadScan"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1c2026]/60">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-text-muted uppercase">AcePayment (token = testnet USDC)</div>
                      <span className="mono text-[11px] text-text-primary">{shortHash(ACE_PAYMENT_ADDRESS, 10, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copy(ACE_PAYMENT_ADDRESS, "payment")}
                        className="text-text-secondary hover:text-text-primary"
                        title="Copy Address"
                      >
                        {copiedContract === "payment" ? <Check className="h-3.5 w-3.5 text-[#298dff]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a
                        href={explorerAddress(ACE_PAYMENT_ADDRESS)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#298dff] hover:text-[#54a6ff]"
                        title="View on MonadScan"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>



                {error && (
                  <div className="border border-[#ff3d3d]/30 bg-[#ff3d3d]/10 p-2.5 text-xs text-[#ff3d3d]" style={{ borderRadius: "2px" }}>
                    {error}
                  </div>
                )}

                <Button
                  className="w-full h-10"
                  onClick={settle}
                  disabled={settling || preview.count === 0}
                >
                  {settling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Committing...
                    </>
                  ) : (
                    <>
                      <span>Commit to Monad L1</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-text-secondary">
                {error || "No pending transactions to settle."}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 text-[#54a6ff]">
              <div className="flex h-8 w-8 items-center justify-center bg-[#298dff]/20 text-[#298dff]" style={{ borderRadius: "2px" }}>
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">Batch Finalized</h3>
                <p className="text-xs text-text-secondary">Committed to Monad Testnet</p>
              </div>
            </div>

            <div className="space-y-2.5 border border-[#1c2026] bg-[#000000] p-3.5 text-xs" style={{ borderRadius: "2px" }}>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Batch Number</span>
                <span className="mono text-[#54a6ff]">#{result.batchId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Volume</span>
                <span className="mono font-semibold">${result.total} USDC</span>
              </div>
              <div className="border-t border-[#1c2026] pt-2">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
                  Monad Transaction Hash
                </div>
                <a
                  href={explorerTx(result.monadTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs text-[#298dff] underline break-all inline-flex items-center gap-1 hover:text-[#54a6ff]"
                >
                  {shortHash(result.monadTxHash, 12, 10)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <a
              href={explorerTx(result.monadTxHash)}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button className="w-full" variant="outline">
                View on Monad Explorer <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
