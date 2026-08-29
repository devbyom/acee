"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Boxes, ExternalLink } from "lucide-react";
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
import { explorerTx } from "@/lib/chain";
import { useAceConfig } from "@/lib/useAceConfig";

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
  const noContract = config && !config.settlementAddress;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close}>
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-primary" />
                Settle pending batch
              </DialogTitle>
              <DialogDescription>
                Collects pending private transactions, builds a Merkle tree, and
                commits the root to AceSettlement on Monad Testnet.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-semibold">
                      BATCH <span className="mono">#{preview.batchId}</span>
                    </span>
                    <Badge variant="secondary">{preview.count} transactions</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    ${preview.total} total
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Merkle Root
                    </div>
                    <div className="mono text-xs break-all text-foreground/80">
                      {preview.merkleRoot}
                    </div>
                  </div>
                </div>

                {(noExecutor || noContract) && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-100/80">
                    {noContract && (
                      <p>Set NEXT_PUBLIC_ACE_CONTRACT_ADDRESS (deploy AceSettlement first).</p>
                    )}
                    {noExecutor && (
                      <p>Set ACE_EXECUTOR_PRIVATE_KEY (server-side) to submit the transaction.</p>
                    )}
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  className="w-full"
                  onClick={settle}
                  disabled={settling || preview.count === 0 || noExecutor || noContract}
                >
                  {settling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting to Monad...
                    </>
                  ) : (
                    "Settle on Monad"
                  )}
                </Button>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {error || "No pending transactions."}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              <span className="text-lg font-semibold">SETTLED</span>
            </div>
            <div className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Batch
                </div>
                <div className="mono">#{result.batchId} · {result.count} tx · ${result.total}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Monad transaction
                </div>
                <a
                  href={explorerTx(result.monadTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-xs text-sky-300 underline break-all inline-flex items-center gap-1"
                >
                  {shortHash(result.monadTxHash, 10, 8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <a
              href={explorerTx(result.monadTxHash)}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full" variant="outline">
                View on MonadScan <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
