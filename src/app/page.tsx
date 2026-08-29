"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  Send,
  Lock,
  Boxes,
  Wallet2,
  TrendingUp,
  Layers,
  Sparkles,
  GitBranch,
  ShieldCheck,
  ChevronRight,
  Coins,
  Activity,
  ArrowRight,
  Flame,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { SendDialog } from "@/components/send-dialog";
import { PredictionDialog } from "@/components/prediction-dialog";
import { SettleDialog } from "@/components/settle-dialog";
import { FaucetDialog } from "@/components/faucet-dialog";
import { ActivityItem } from "@/components/activity-item";
import { TrustModel } from "@/components/trust-model";
import { Canvas3DScene } from "@/components/canvas-3d-scene";
import { MerkleVisualizer } from "@/components/merkle-visualizer";
import { useAceConfig } from "@/lib/useAceConfig";
import { formatAmount, shortHash } from "@/lib/utils";
import { explorerAddress } from "@/lib/chain";
import type { Transaction } from "@/lib/types";
import {
  ERC20_ABI,
  TESTNET_USDC_ADDRESS,
  USDC_DECIMALS,
  ACE_SETTLEMENT_ADDRESS,
  ACE_PAYMENT_ADDRESS,
} from "@/lib/contracts";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { config } = useAceConfig();

  const [sendOpen, setSendOpen] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [faucetOpen, setFaucetOpen] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"activity" | "settle" | "merkle" | "markets" | "trust">("activity");
  const [txFilter, setTxFilter] = useState<"all" | "payment" | "prediction">("all");
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 1500);
  };

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
    txs.filter((t) => t.batchId && (t.status === "confirmed" || t.status === "batched")).map((t) => t.batchId)
  );

  const filteredTxs = txs.filter((t) => {
    if (txFilter === "payment") return t.type === "payment";
    if (txFilter === "prediction") return t.type === "prediction";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#000000] text-text-primary sui-bg">
      {/* Top Banner Notice */}
      <div className="border-b border-[#1c2026] bg-[#000000]/90 backdrop-blur-md px-4 py-2 text-center text-xs text-text-secondary flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#298dff] animate-pulse" />
          <span className="font-medium text-text-primary">Monad Network</span>
        </div>
        <span className="text-text-muted">•</span>
        <span className="hidden sm:inline">Private intent execution → Off-chain Merkle rollup → Sub-second finality</span>
        <Badge variant="default" className="text-[10px] py-0 px-1.5">
          v1.0 Live
        </Badge>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-8">
        {/* Navigation Bar */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1c2026] pb-5">
          <div className="flex items-center gap-3">
            <div
              style={{ width: "40px", height: "40px", minWidth: "40px", minHeight: "40px", borderRadius: "2px" }}
              className="flex items-center justify-center bg-[#0d0f12] border border-[#298dff]/40 p-1.5 shadow-[0_0_20px_rgba(41,141,255,0.35)] shrink-0"
            >
              <svg viewBox="0 0 512 512" width="28" height="28" style={{ width: "28px", height: "28px", display: "block" }}>
                <path
                  d="M 256 80 L 426 360 C 434 374, 426 392, 410 398 C 403 400, 395 398, 389 392 L 338 335 L 262 186 C 259 180, 253 180, 250 186 L 192 300 L 123 392 C 117 398, 109 400, 102 398 C 86 392, 78 374, 86 360 L 237 94 Z"
                  fill="#298dff"
                />
                <path
                  d="M 256 260 Q 256 310 216 310 Q 256 310 256 360 Q 256 310 296 310 Q 256 310 256 260 Z"
                  fill="#54a6ff"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-text-primary">
                  ACE <span className="text-[#298dff] font-normal text-xs mono">PROTOCOL</span>
                </h1>
                <Badge variant="default" className="text-[9px]">
                  CONFIDENTIAL
                </Badge>
              </div>
              <p className="text-xs text-text-secondary">
                Private Execution &amp; Rollup Settlement on Monad
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFaucetOpen(true)}
              className="text-xs border-[#1c2026] hover:border-[#298dff]/50"
            >
              <Coins className="h-3.5 w-3.5 text-[#298dff] mr-1.5" />
              Testnet Faucet
            </Button>
            <WalletConnect />
          </div>
        </header>

        {/* 3D Interactive Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          <div className="lg:col-span-6 space-y-5">
            <div
              style={{ borderRadius: "2px" }}
              className="inline-flex items-center gap-2 border border-[#298dff]/30 bg-[#298dff]/10 px-3 py-1 text-xs font-medium text-[#54a6ff]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#298dff]" />
              <span>Where Private Intents Execute</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight leading-[1.1] text-text-primary">
                Private Execution. <br />
                <span className="text-[#298dff] font-medium">Zero Leakage.</span>
              </h2>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-xl">
                Execute payments and prediction markets confidentially without leaking wallet strategies, counterparty records, or individual trade balances.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                size="lg"
                onClick={() => setSendOpen(true)}
                className="font-medium text-sm bg-[#298dff] hover:bg-[#1a7ae6] text-white shadow-[0_0_25px_rgba(41,141,255,0.4)]"
              >
                <Send className="h-4 w-4 mr-1.5" /> Send Confidentially
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPredictOpen(true)}
                className="font-medium text-sm border-[#298dff]/40 text-[#54a6ff] hover:bg-[#298dff]/10"
              >
                <Lock className="h-4 w-4 mr-1.5 text-[#298dff]" /> Trade Market
              </Button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border border-[#1c2026] bg-[#0d0f12] p-3 space-y-1" style={{ borderRadius: "2px" }}>
                <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#298dff]" /> Stealth State
                </div>
                <p className="text-[11px] text-text-secondary">Off-chain ledgers shield metadata before rollup.</p>
              </div>
              <div className="border border-[#1c2026] bg-[#0d0f12] p-3 space-y-1" style={{ borderRadius: "2px" }}>
                <div className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                  <GitBranch className="h-3.5 w-3.5 text-[#54a6ff]" /> Merkle Proofs
                </div>
                <p className="text-[11px] text-text-secondary">Sub-second Keccak-256 tree commitment to Monad.</p>
              </div>
            </div>
          </div>

          {/* Interactive 3D WebGL Canvas Scene */}
          <div className="lg:col-span-6">
            <Canvas3DScene />
          </div>
        </section>

        {/* Live Metrics Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Wallet2 className="h-4 w-4 text-[#298dff]" />}
            label="USDC Balance"
            value={<UsdcBalance address={address} connected={isConnected} />}
            subtitle="Connected Account"
          />
          <StatCard
            icon={<Send className="h-4 w-4 text-[#298dff]" />}
            label="Private Transfers"
            value={String(payments.length)}
            subtitle="Confidential Intents"
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-[#54a6ff]" />}
            label="Predictions"
            value={String(predictions.length)}
            subtitle="Relayed Positions"
          />
          <StatCard
            icon={<Layers className="h-4 w-4 text-[#298dff]" />}
            label="Settled Batches"
            value={String(settledBatchIds.size)}
            subtitle="Monad Merkle Roots"
          />
        </section>

        {/* Quick Action Cards */}
        <section className="grid gap-3 sm:grid-cols-3">
          <ActionCard
            title="Private Send"
            subtitle="Encrypted peer-to-peer transfer"
            badge="Confidential"
            icon={<Send className="h-4 w-4" />}
            onClick={() => setSendOpen(true)}
          />
          <ActionCard
            title="Market Position"
            subtitle="Take confidential prediction orders"
            badge="Zero Leakage"
            icon={<Lock className="h-4 w-4" />}
            onClick={() => setPredictOpen(true)}
          />
          <ActionCard
            title="Commit Batch"
            subtitle="Commit Merkle proof to Monad"
            badge="On-Chain Rollup"
            icon={<Boxes className="h-4 w-4" />}
            onClick={() => setSettleOpen(true)}
          />
        </section>

        {/* Navigation Tabs */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c2026] pb-3">
            <div className="flex items-center gap-1 p-0.5 bg-[#0d0f12] border border-[#1c2026]" style={{ borderRadius: "2px" }}>
              <button
                onClick={() => setActiveTab("activity")}
                style={{ borderRadius: "2px" }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "activity"
                    ? "bg-[#298dff] text-white shadow-[0_0_15px_rgba(41,141,255,0.3)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Activity className="h-3 w-3" /> Activity Log
              </button>
              <button
                onClick={() => setActiveTab("settle")}
                style={{ borderRadius: "2px" }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "settle"
                    ? "bg-[#298dff] text-white shadow-[0_0_15px_rgba(41,141,255,0.3)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Boxes className="h-3 w-3" /> Settlement Protocol
              </button>
              <button
                onClick={() => setActiveTab("merkle")}
                style={{ borderRadius: "2px" }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "merkle"
                    ? "bg-[#298dff] text-white shadow-[0_0_15px_rgba(41,141,255,0.3)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <GitBranch className="h-3 w-3" /> Merkle Tree
              </button>
              <button
                onClick={() => setActiveTab("markets")}
                style={{ borderRadius: "2px" }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "markets"
                    ? "bg-[#298dff] text-white shadow-[0_0_15px_rgba(41,141,255,0.3)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Flame className="h-3 w-3" /> Live Markets
              </button>
              <button
                onClick={() => setActiveTab("trust")}
                style={{ borderRadius: "2px" }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === "trust"
                    ? "bg-[#298dff] text-white shadow-[0_0_15px_rgba(41,141,255,0.3)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <ShieldCheck className="h-3 w-3" /> Trust Model
              </button>
            </div>

            {activeTab === "activity" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettleOpen(true)}
                className="text-xs text-[#54a6ff] hover:text-[#298dff]"
              >
                <Boxes className="h-3 w-3 mr-1" /> Settle Pending Batch
              </Button>
            )}
          </div>

          {/* Tab 1: Activity Log */}
          {activeTab === "activity" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {(["all", "payment", "prediction"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTxFilter(filter)}
                      style={{ borderRadius: "2px" }}
                      className={`text-xs px-2.5 py-0.5 border capitalize transition-all ${
                        txFilter === filter
                          ? "border-[#298dff]/40 bg-[#298dff]/10 text-[#54a6ff] font-medium"
                          : "border-[#1c2026] bg-[#0d0f12] text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {filter === "all" ? "All Activity" : `${filter}s`}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-text-muted mono">{filteredTxs.length} records</span>
              </div>

              <div className="space-y-2">
                {filteredTxs.length === 0 ? (
                  <div className="border border-[#1c2026] bg-[#0d0f12] p-8 text-center space-y-2.5" style={{ borderRadius: "2px" }}>
                    <div className="flex h-10 w-10 items-center justify-center bg-[#298dff]/10 text-[#298dff] mx-auto" style={{ borderRadius: "2px" }}>
                      <Activity className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-medium text-text-primary">No Activity Recorded</h3>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto">
                      Send a private payment or take a confidential prediction market position to populate the ledger.
                    </p>
                    <div className="flex justify-center gap-2.5 pt-1">
                      <Button size="sm" onClick={() => setSendOpen(true)}>
                        <Send className="h-3 w-3 mr-1" /> Send Money
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPredictOpen(true)}>
                        <Lock className="h-3 w-3 mr-1 text-[#298dff]" /> Predict
                      </Button>
                    </div>
                  </div>
                ) : (
                  filteredTxs.map((tx) => <ActivityItem key={tx.id} tx={tx} />)
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Settlement Protocol Section */}
          {activeTab === "settle" && (
            <div className="space-y-4">
              <div className="border border-[#1c2026] bg-[#0d0f12] p-5 space-y-4" style={{ borderRadius: "2px" }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1c2026] pb-3">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#298dff]" /> Deployed Settlement Contracts
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      On-chain smart contracts deployed on Monad Testnet (`10143`)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSettleOpen(true)}
                    className="h-8 text-xs font-medium"
                  >
                    <Boxes className="h-3.5 w-3.5 mr-1" /> Settle Pending Batch
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* AceSettlement Contract */}
                  <div className="border border-[#1c2026] bg-[#000000] p-3.5 space-y-2" style={{ borderRadius: "2px" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#54a6ff]">AceSettlement</span>
                      <Badge variant="default">operator = your executor</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-[#0d0f12] p-2 border border-[#1c2026]">
                      <span className="mono text-xs text-text-primary truncate mr-2">
                        {ACE_SETTLEMENT_ADDRESS}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copy(ACE_SETTLEMENT_ADDRESS, "settle-tab")}
                          className="text-text-secondary hover:text-text-primary p-1"
                          title="Copy Address"
                        >
                          {copiedContract === "settle-tab" ? <Check className="h-3.5 w-3.5 text-[#298dff]" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <a
                          href={explorerAddress(ACE_SETTLEMENT_ADDRESS)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#298dff] hover:text-[#54a6ff] p-1"
                          title="View on MonadScan"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Stores canonical Merkle root commitments committed by the authorized operator on Monad.
                    </p>
                  </div>

                  {/* AcePayment Contract */}
                  <div className="border border-[#1c2026] bg-[#000000] p-3.5 space-y-2" style={{ borderRadius: "2px" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#54a6ff]">AcePayment</span>
                      <Badge variant="secondary">token = testnet USDC</Badge>
                    </div>
                    <div className="flex items-center justify-between bg-[#0d0f12] p-2 border border-[#1c2026]">
                      <span className="mono text-xs text-text-primary truncate mr-2">
                        {ACE_PAYMENT_ADDRESS}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copy(ACE_PAYMENT_ADDRESS, "pay-tab")}
                          className="text-text-secondary hover:text-text-primary p-1"
                          title="Copy Address"
                        >
                          {copiedContract === "pay-tab" ? <Check className="h-3.5 w-3.5 text-[#298dff]" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <a
                          href={explorerAddress(ACE_PAYMENT_ADDRESS)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#298dff] hover:text-[#54a6ff] p-1"
                          title="View on MonadScan"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Non-custodial escrow for confidential payments settled via testnet USDC tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Merkle Tree Visualizer */}
          {activeTab === "merkle" && <MerkleVisualizer />}

          {/* Tab 4: Featured Markets */}
          {activeTab === "markets" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MarketCard
                marketId="demo-india-win"
                title="ICC Champions Trophy: India vs Australia Finals Winner?"
                protocol="RushTrade Monad"
                yesPercent={68}
                noPercent={32}
                volume="$48,200 USDC"
                onTrade={() => setPredictOpen(true)}
              />
              <MarketCard
                marketId="demo-btc-100k"
                title="Bitcoin price to sustain above $100k in 2026?"
                protocol="RushTrade Monad"
                yesPercent={81}
                noPercent={19}
                volume="$112,900 USDC"
                onTrade={() => setPredictOpen(true)}
              />
            </div>
          )}

          {/* Tab 5: Trust Model */}
          {activeTab === "trust" && <TrustModel />}
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1c2026] pt-5 pb-3 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
            <span>Monad Testnet (10143)</span>
            <span>•</span>
            <span>Sub-Second Finality</span>
            <span>•</span>
            <span>Merkle Commitments</span>
          </div>
          <p className="text-[11px] text-text-muted">
            Ace Protocol • Confidential Payments &amp; Decentralized Prediction Market Rollup on Monad.
          </p>
        </footer>
      </div>

      <SendDialog open={sendOpen} onOpenChange={setSendOpen} onCreated={refresh} />
      <PredictionDialog open={predictOpen} onOpenChange={setPredictOpen} onExecuted={refresh} />
      <SettleDialog open={settleOpen} onOpenChange={setSettleOpen} onSettled={refresh} />
      <FaucetDialog open={faucetOpen} onOpenChange={setFaucetOpen} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle: string;
}) {
  return (
    <Card className="sui-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-text-secondary">
          <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
          <div className="flex h-7 w-7 items-center justify-center bg-[#131518] border border-[#1c2026]" style={{ borderRadius: "2px" }}>
            {icon}
          </div>
        </div>
        <div className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{value}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  subtitle,
  badge,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ borderRadius: "2px" }}
      className="group flex flex-col justify-between border border-[#1c2026] bg-[#0d0f12] p-4 text-left transition-all duration-150 hover:border-[#298dff]/50 hover:bg-[#131518]"
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div
          style={{ borderRadius: "2px" }}
          className="flex h-8 w-8 items-center justify-center border border-[#298dff]/30 bg-[#298dff]/10 text-[#54a6ff] group-hover:bg-[#298dff]/20 transition-colors"
        >
          {icon}
        </div>
        <Badge variant="default" className="text-[9px]">
          {badge}
        </Badge>
      </div>
      <div>
        <div className="text-sm font-medium text-text-primary flex items-center justify-between">
          <span>{title}</span>
          <ChevronRight className="h-3.5 w-3.5 text-text-muted group-hover:text-[#298dff] group-hover:translate-x-0.5 transition-transform" />
        </div>
        <div className="text-xs text-text-secondary mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

function MarketCard({
  marketId,
  title,
  protocol,
  yesPercent,
  noPercent,
  volume,
  onTrade,
}: {
  marketId: string;
  title: string;
  protocol: string;
  yesPercent: number;
  noPercent: number;
  volume: string;
  onTrade: () => void;
}) {
  return (
    <div
      style={{ borderRadius: "2px" }}
      className="border border-[#1c2026] bg-[#0d0f12] p-4 flex flex-col justify-between space-y-3 hover:border-[#298dff]/40 transition-all"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Badge variant="default" className="text-[9px]">
            {protocol}
          </Badge>
          <span className="mono text-[10px] text-text-muted">Vol: {volume}</span>
        </div>
        <h4 className="text-xs font-medium text-text-primary leading-snug">{title}</h4>
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-[#000000] overflow-hidden flex" style={{ borderRadius: "1px" }}>
          <div style={{ width: `${yesPercent}%` }} className="bg-[#298dff] h-full" />
          <div style={{ width: `${noPercent}%` }} className="bg-[#ff3d3d] h-full" />
        </div>
        <div className="flex justify-between text-[11px] font-medium">
          <span className="text-[#54a6ff]">YES {yesPercent}% ({yesPercent}¢)</span>
          <span className="text-[#ff3d3d]">NO {noPercent}% ({noPercent}¢)</span>
        </div>
      </div>

      <Button
        onClick={onTrade}
        size="sm"
        className="w-full text-xs font-medium"
        variant="outline"
      >
        <Lock className="h-3 w-3 mr-1 text-[#298dff]" /> Trade Confidentially
      </Button>
    </div>
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

  if (!connected) return <span className="text-sm font-medium text-text-muted">—</span>;
  const bal =
    usdc.data !== undefined
      ? formatAmount(formatUnits(usdc.data as bigint, USDC_DECIMALS), 2)
      : "…";
  return (
    <span>
      {bal} <span className="text-xs font-normal text-text-secondary">USDC</span>
    </span>
  );
}
