"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Send, Lock, Boxes, Wallet2, TrendingUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { SendDialog } from "@/components/send-dialog";
import { PredictionDialog } from "@/components/prediction-dialog";
import { SettleDialog } from "@/components/settle-dialog";
import { ActivityItem } from "@/components/activity-item";
import { TrustModel } from "@/components/trust-model";
import { useAceConfig } from "@/lib/useAceConfig";
import { formatAmount } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { ERC20_ABI, TESTNET_USDC_ADDRESS, USDC_DECIMALS } from "@/lib/contracts";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { config } = useAceConfig();

  const [sendOpen, setSendOpen] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);

  const refresh = useCallback(() => {
    const q = address ? `?address=${address}` : "";
    fetch(`/api/payments${q}`)
      .then((r) => r.json())
      .then((data) => setTxs(data.transactions || []))
      .catch(() => {});
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const payments = txs.filter((t) => t.type === "payment");
  const predictions = txs.filter((t) => t.type === "prediction");
  const settledBatchIds = new Set(
    txs.filter((t) => t.batchId && t.status === "confirmed").map((t) => t.batchId)
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
            <span className="text-lg font-bold text-white">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ACE</h1>
            <p className="text-sm text-muted-foreground">
              Private payments &amp; prediction execution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {config?.demoMode && <Badge variant="warning">DEMO MODE</Badge>}
          <WalletConnect />
        </div>
      </header>

      {/* Principle strip */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-center text-xs text-muted-foreground">
        Private intent → private application state → controlled execution → Monad settlement
      </div>

      {/* Stat cards */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Wallet2 className="h-4 w-4" />}
          label="Balance"
          value={<UsdcBalance address={address} connected={isConnected} />}
        />
        <StatCard
          icon={<Send className="h-4 w-4" />}
          label="Private Payments"
          value={String(payments.length)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Predictions"
          value={String(predictions.length)}
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="Settled Batches"
          value={String(settledBatchIds.size)}
        />
      </section>

      {/* Primary actions */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <ActionCard
          title="Send Money"
          subtitle="Private P2P payment"
          icon={<Send className="h-5 w-5" />}
          onClick={() => setSendOpen(true)}
        />
        <ActionCard
          title="Private Prediction"
          subtitle="Bet privately via Ace executor"
          icon={<Lock className="h-5 w-5" />}
          onClick={() => setPredictOpen(true)}
          accent
        />
      </section>

      {/* Recent activity */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setSettleOpen(true)}>
            <Boxes className="h-4 w-4" /> Settle Pending Batch
          </Button>
        </div>
        <div className="space-y-2">
          {txs.length === 0 ? (
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-muted-foreground">
              No activity yet. Send a private payment or place a prediction.
            </div>
          ) : (
            txs.map((tx) => <ActivityItem key={tx.id} tx={tx} />)
          )}
        </div>
      </section>

      {/* Trust model */}
      <section className="mt-8">
        <TrustModel />
      </section>

      <footer className="mt-8 text-center text-[11px] text-muted-foreground">
        Monad Testnet · Chain 10143 · Testnet only. Ace does not currently provide
        cryptographic position privacy.
      </footer>

      <SendDialog open={sendOpen} onOpenChange={setSendOpen} onCreated={refresh} />
      <PredictionDialog open={predictOpen} onOpenChange={setPredictOpen} onExecuted={refresh} />
      <SettleDialog open={settleOpen} onOpenChange={setSettleOpen} onSettled={refresh} />
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        <div className="mt-2 text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  onClick,
  accent,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center justify-between rounded-2xl border p-6 text-left transition-all hover:scale-[1.01] ${
        accent
          ? "border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-primary/5"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            accent ? "bg-violet-500/20 text-violet-200" : "bg-primary/20 text-primary"
          }`}
        >
          {icon}
        </div>
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function UsdcBalance({
  address,
  connected,
}: {
  address?: `0x${string}`;
  connected: boolean;
}) {
  const usdc = useReadContract({
    address: TESTNET_USDC_ADDRESS || undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(TESTNET_USDC_ADDRESS && address) },
  });

  if (!connected) return <span className="text-base font-medium text-muted-foreground">—</span>;
  const bal =
    usdc.data !== undefined
      ? formatAmount(formatUnits(usdc.data as bigint, USDC_DECIMALS), 2)
      : "…";
  return (
    <span>
      {bal} <span className="text-sm font-normal text-muted-foreground">USDC</span>
    </span>
  );
}
