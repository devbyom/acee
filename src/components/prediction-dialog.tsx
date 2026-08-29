"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Check, Loader2, Lock, TrendingUp, ExternalLink, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { shortHash } from "@/lib/utils";
import { explorerTx } from "@/lib/chain";

interface ImportedMarket {
  marketId: string;
  question: string;
  outcomes: string[];
  status: string;
  currentData?: { yesCents?: number; noCents?: number };
  isDemo?: boolean;
  protocol: string;
}

interface ExecuteResult {
  transactionId: string;
  market: { marketId: string; question: string; outcome: string };
  execution: {
    mode: "onchain" | "demo";
    txHash?: string;
    executorAddress?: string;
    note?: string;
  };
  isDemo: boolean;
  demoLabel?: string;
}

type Step = "import" | "bet" | "done";

export function PredictionDialog({
  open,
  onOpenChange,
  onExecuted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecuted?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<Step>("import");
  const [url, setUrl] = useState("");
  const [market, setMarket] = useState<ImportedMarket | null>(null);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);

  function reset() {
    setStep("import");
    setUrl("");
    setMarket(null);
    setOutcome("YES");
    setAmount("10");
    setError(null);
    setResult(null);
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  async function importMarket(marketIdOrUrl?: string) {
    setError(null);
    setLoading(true);
    const target = marketIdOrUrl || url;
    try {
      const res = await fetch("/api/predictions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol: "rushtrade", marketUrl: target, marketId: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import market");
      setMarket(data);
      setStep("bet");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function placeBet() {
    setError(null);
    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!market) return;
    setLoading(true);
    try {
      const res = await fetch("/api/predictions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          protocol: "rushtrade",
          marketId: market.marketId,
          outcome,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place prediction");
      setResult(data);
      setStep("done");
      onExecuted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const yesCents = market?.currentData?.yesCents ?? 68;
  const noCents = market?.currentData?.noCents ?? 32;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close}>
        {step === "import" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <DialogTitle>Confidential Market Position</DialogTitle>
              </div>
              <DialogDescription>
                Execute prediction market orders via the Ace relayer to mask counterparty strategy and portfolio allocations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-text-secondary">
                  Market URL or Identifier
                </Label>
                <Input
                  placeholder="e.g. demo-india-win, demo-btc-100k"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mono text-xs"
                />
              </div>

              {/* Quick Select Presets */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  Quick Select Markets:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUrl("demo-india-win");
                      importMarket("demo-india-win");
                    }}
                    style={{ borderRadius: "2px" }}
                    className="flex flex-col items-start p-2.5 border border-[#1c2026] bg-[#000000] hover:border-[#298dff]/50 hover:bg-[#298dff]/5 transition-all text-left"
                  >
                    <span className="text-xs font-medium text-text-primary">India vs Aus Finals</span>
                    <span className="text-[10px] text-text-secondary">Cricket Championship</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUrl("demo-btc-100k");
                      importMarket("demo-btc-100k");
                    }}
                    style={{ borderRadius: "2px" }}
                    className="flex flex-col items-start p-2.5 border border-[#1c2026] bg-[#000000] hover:border-[#298dff]/50 hover:bg-[#298dff]/5 transition-all text-left"
                  >
                    <span className="text-xs font-medium text-text-primary">BTC &gt; $100k 2026</span>
                    <span className="text-[10px] text-text-secondary">Crypto Milestone</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="border border-[#ff3d3d]/30 bg-[#ff3d3d]/10 p-2.5 text-xs text-[#ff3d3d]" style={{ borderRadius: "2px" }}>
                  {error}
                </div>
              )}

              <Button
                className="w-full h-10"
                onClick={() => importMarket()}
                disabled={loading || !url}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    <span>Import Market</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "bet" && market && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  {market.protocol}
                </Badge>
                {market.isDemo && (
                  <Badge variant="secondary">
                    Demo Mode
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-sm leading-snug mt-1.5">
                {market.question}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOutcome("YES")}
                  style={{ borderRadius: "2px" }}
                  className={`flex flex-col items-center justify-center gap-1 p-3.5 border transition-all ${
                    outcome === "YES"
                      ? "border-[#298dff] bg-[#298dff]/15 text-[#54a6ff]"
                      : "border-[#1c2026] bg-[#000000] text-text-secondary hover:border-[#1c2026]/80"
                  }`}
                >
                  <span className="text-sm font-bold">YES</span>
                  <span className="mono text-xs">{yesCents}¢</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome("NO")}
                  style={{ borderRadius: "2px" }}
                  className={`flex flex-col items-center justify-center gap-1 p-3.5 border transition-all ${
                    outcome === "NO"
                      ? "border-[#ff3d3d] bg-[#ff3d3d]/15 text-[#ff3d3d]"
                      : "border-[#1c2026] bg-[#000000] text-text-secondary hover:border-[#1c2026]/80"
                  }`}
                >
                  <span className="text-sm font-bold">NO</span>
                  <span className="mono text-xs">{noCents}¢</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-text-secondary">
                  Position Size (USDC)
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-2 border border-[#1c2026] bg-[#000000] p-3 text-xs text-text-secondary" style={{ borderRadius: "2px" }}>
                <Lock className="h-3.5 w-3.5 text-[#298dff] shrink-0 mt-0.5" />
                <span>
                  Intent stored in Ace private ledger. Relayer executes position on-chain.
                </span>
              </div>

              {error && (
                <div className="border border-[#ff3d3d]/30 bg-[#ff3d3d]/10 p-2.5 text-xs text-[#ff3d3d]" style={{ borderRadius: "2px" }}>
                  {error}
                </div>
              )}

              <Button
                className="w-full h-10"
                onClick={placeBet}
                disabled={loading || !amount || Number(amount) <= 0}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 mr-1" />
                    <span>Execute Confidential Bet</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "done" && result && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 text-[#54a6ff]">
              <div className="flex h-8 w-8 items-center justify-center bg-[#298dff]/20 text-[#298dff]" style={{ borderRadius: "2px" }}>
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">Position Confirmed</h3>
                <p className="text-xs text-text-secondary">Recorded in confidential ledger</p>
              </div>
            </div>

            <div className="space-y-2.5 border border-[#1c2026] bg-[#000000] p-3.5 text-xs" style={{ borderRadius: "2px" }}>
              <div className="flex justify-between items-center pb-2 border-b border-[#1c2026]">
                <span className="text-text-muted">Market</span>
                <span className="text-text-primary truncate max-w-[220px]">{result.market.question}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1c2026]">
                <span className="text-text-muted">Position</span>
                <span className="mono font-bold text-[#54a6ff]">{result.market.outcome} ({amount} USDC)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Intent ID</span>
                <span className="mono text-[11px] text-text-secondary">{result.transactionId}</span>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={close}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
