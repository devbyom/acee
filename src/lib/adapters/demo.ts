import { randomBytes } from "crypto";
import { formatUnits } from "viem";
import type { PredictionMarketAdapter } from "./types";
import type { Market, Quote, Position, ExecutionResult } from "@/lib/types";
import { USDC_DECIMALS } from "@/lib/contracts";

/**
 * DEMO_EXTERNAL_MARKET
 *
 * A clearly-labeled, simulated external prediction market used ONLY when
 * DEMO_MODE=true and no real external protocol is configured.
 *
 * This is NOT a real prediction market and NEVER produces a real transaction.
 * Every result it returns has mode "demo" and no txHash. The UI must display
 * "DEMO MODE — NOT AN ON-CHAIN BET" for anything sourced here.
 */

interface DemoMarketDef {
  question: string;
  yesCents: number;
  noCents: number;
}

const DEMO_MARKETS: Record<string, DemoMarketDef> = {
  "demo-india-win": {
    question: "India to win the match",
    yesCents: 64,
    noCents: 36,
  },
  "demo-btc-100k": {
    question: "BTC above $100k by year end",
    yesCents: 58,
    noCents: 42,
  },
  "demo-eth-flip": {
    question: "ETH to flip a major milestone this quarter",
    yesCents: 47,
    noCents: 53,
  },
};

const DEFAULT_DEMO: DemoMarketDef = {
  question: "Imported external market (demo)",
  yesCents: 55,
  noCents: 45,
};

export class DemoMarketAdapter implements PredictionMarketAdapter {
  readonly protocol = "DEMO_EXTERNAL_MARKET";

  private def(marketId: string): DemoMarketDef {
    return DEMO_MARKETS[marketId] ?? DEFAULT_DEMO;
  }

  async getMarket(marketId: string): Promise<Market> {
    const d = this.def(marketId);
    return {
      marketId,
      protocol: this.protocol,
      question: d.question,
      outcomes: ["YES", "NO"],
      status: "OPEN",
      isDemo: true,
      currentData: { yesCents: d.yesCents, noCents: d.noCents },
    };
  }

  async getQuote(marketId: string, outcome: string, amount: bigint): Promise<Quote> {
    const d = this.def(marketId);
    const priceCents = outcome.toUpperCase() === "YES" ? d.yesCents : d.noCents;
    return {
      marketId,
      outcome: outcome.toUpperCase(),
      amount: formatUnits(amount, USDC_DECIMALS),
      priceCents,
      isDemo: true,
    };
  }

  async placeBet(marketId: string, outcome: string, amount: bigint): Promise<ExecutionResult> {
    // Simulated only. NO transaction hash is ever returned.
    const positionId = `demo_pos_${randomBytes(6).toString("hex")}`;
    return {
      mode: "demo",
      positionId,
      note: "DEMO MODE — NOT AN ON-CHAIN BET. No real transaction was submitted.",
    };
  }

  async getPosition(positionId: string): Promise<Position> {
    return {
      positionId,
      marketId: "demo",
      outcome: "YES",
      amount: "0",
      status: "OPEN",
      isDemo: true,
    };
  }

  async claim(positionId: string): Promise<ExecutionResult> {
    return {
      mode: "demo",
      positionId,
      note: "DEMO MODE — simulated claim. No real transaction was submitted.",
    };
  }
}
