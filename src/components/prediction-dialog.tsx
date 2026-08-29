"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Check, Loader2, Lock, TrendingUp, ExternalLink } from "lucide-react";
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
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecuteResult | null>(null);

  function reset() {
    setStep("import");
    setUrl("");
    setMarket(null);
    setOutcome("YES");
    setAmount("");
    setError(null);
    setResult(null);
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  async function importMarket() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/predictions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol: "rushtrade", marketUrl: url, marketId: url }),
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
      setError("Connect your wallet first.");
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

  const yesCents = market?.currentData?.yesCents;
  const noCents = market?.currentData?.noCents;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close}>
        {step === "import" && (
          <>
            <DialogHeader>
              <DialogTitle>Private prediction</DialogTitle>
              <DialogDescription>
                Import an existing external prediction market. Ace does not create
                markets — it executes your position privately through its executor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Paste market URL or ID</Label>
                <Input
                  placeholder="https://rushtrade.xyz/market/... or demo-india-win"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Try <span className="mono">demo-india-win</span>,{" "}
                  <span className="mono">demo-btc-100k</span>
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={importMarket} disabled={loading || !url}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Import Market
              </Button>
            </div>
          </>
        )}

        {step === "bet" && market && (
          <>
            <DialogHeader>
              <DialogTitle>{market.question}</DialogTitle>
              <DialogDescription>
                {market.isDemo ? (
                  <Badge variant="warning">DEMO MODE — NOT AN ON-CHAIN BET</Badge>
                ) : (
                  <span className="mono text-xs">{market.protocol} · {shortHash(market.marketId, 8, 6)}</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <OutcomeButton
                  label="YES"
                  cents={yesCents}
                  selected={outcome === "YES"}
                  onClick={() => setOutcome("YES")}
                  accent="success"
                />
                <OutcomeButton
                  label="NO"
                  cents={noCents}
                  selected={outcome === "NO"}
                  onClick={() => setOutcome("NO")}
                  accent="destructive"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3 text-xs text-violet-100/80">
                <Lock className="h-3.5 w-3.5" />
                Executed privately through Ace&apos;s executor.
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button className="w-full" onClick={placeBet} disabled={loading || !amount}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Place Prediction
              </Button>
            </div>
          </>
        )}

        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              <span className="text-lg font-semibold">Prediction submitted</span>
            </div>

            {result.isDemo && (
              <Badge variant="warning">{result.demoLabel}</Badge>
            )}

            <div className="space-y-3 rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
              <Row label="Market" value={result.market.question} />
              <Row label="Position" value={result.market.outcome} />
              <Row label="Amount" value={`${amount} USDC`} />

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ace private intent
                </div>
                <div className="mono text-xs">{result.transactionId}</div>
              </div>

              {result.execution.mode === "onchain" && result.execution.txHash ? (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Monad transaction (public execution)
                  </div>
                  <a
                    href={explorerTx(result.execution.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-xs text-sky-300 underline break-all inline-flex items-center gap-1"
                  >
                    {shortHash(result.execution.txHash, 10, 8)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.06] p-2 text-[11px] text-amber-100/80">
                  {result.execution.note ||
                    "No real transaction was submitted (demo)."}
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Your Ace-private intent is separate from the public execution record.
              Where a real bet is placed, the external protocol&apos;s execution
              wallet may remain publicly visible.
            </p>

            <Button className="w-full" variant="outline" onClick={close}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OutcomeButton({
  label,
  cents,
  selected,
  onClick,
  accent,
}: {
  label: string;
  cents?: number;
  selected: boolean;
  onClick: () => void;
  accent: "success" | "destructive";
}) {
  const ring =
    accent === "success"
      ? "border-success/50 bg-success/15 text-success"
      : "border-destructive/50 bg-destructive/15 text-destructive";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border p-4 transition-colors ${
        selected ? ring : "border-white/10 bg-black/30 hover:bg-white/5"
      }`}
    >
      <span className="text-sm font-semibold">{label}</span>
      {cents !== undefined && (
        <span className="text-xs text-muted-foreground">{cents}¢</span>
      )}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
