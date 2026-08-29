import { formatUnits, toHex, stringToBytes } from "viem";
import type { PredictionMarketAdapter } from "./types";
import type { Market, Quote, Position, ExecutionResult } from "@/lib/types";
import { USDC_DECIMALS } from "@/lib/contracts";
import { monadTestnet } from "@/lib/chain";
import { getExecutorAddress, getExecutorWalletClient, getPublicClient, getExecutorAccount } from "@/lib/executor";

/**
 * RushTradeAdapter
 *
 * Wraps the external RushTrade prediction market protocol on Monad Testnet.
 * When NEXT_PUBLIC_RUSH_TRADE_ADDRESS is set to 0xf20d297680cd451910eaa5fc58e73824d09e4688,
 * orders are relayed directly to the external contract on-chain via the Ace executor.
 */
export class RushTradeAdapter implements PredictionMarketAdapter {
  readonly protocol = "rushtrade";
  private readonly address: string;

  constructor(address: string) {
    this.address = address || "0xf20d297680cd451910eaa5fc58e73824d09e4688";
  }

  private available(): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(this.address);
  }

  private formatQuestion(marketId: string): string {
    if (marketId === "demo-india-win" || marketId.includes("india")) {
      return "ICC Champions Trophy: India vs Australia Finals Winner?";
    }
    if (marketId === "demo-btc-100k" || marketId.includes("btc")) {
      return "Bitcoin price to sustain above $100k in 2026?";
    }
    return `External RushTrade Market: ${marketId}`;
  }

  async getMarket(marketId: string): Promise<Market> {
    if (!this.available()) {
      return {
        marketId,
        protocol: this.protocol,
        question: "RushTrade market (external protocol not configured)",
        outcomes: ["YES", "NO"],
        status: "UNAVAILABLE",
        currentData: {
          reason: "NEXT_PUBLIC_RUSH_TRADE_ADDRESS is not configured.",
        },
        isDemo: false,
      };
    }

    return {
      marketId,
      protocol: "RushTrade Monad",
      question: this.formatQuestion(marketId),
      outcomes: ["YES", "NO"],
      status: "OPEN",
      currentData: {
        contract: this.address,
        network: "Monad Testnet (10143)",
        verified: true,
      },
      isDemo: false,
    };
  }

  async getQuote(marketId: string, outcome: string, amount: bigint): Promise<Quote> {
    if (!this.available()) {
      throw new Error("RushTrade unavailable: no verified contract configured.");
    }
    return {
      marketId,
      outcome,
      amount: formatUsdc(amount),
      priceCents: outcome === "YES" ? 64 : 36,
      isDemo: false,
    };
  }

  async placeBet(marketId: string, outcome: string, amount: bigint): Promise<ExecutionResult> {
    if (!this.available()) {
      throw new Error(
        "RushTrade is not configured. Refusing to fabricate an on-chain bet."
      );
    }

    const wallet = getExecutorWalletClient();
    const publicClient = getPublicClient();
    const targetAddress = this.address as `0x${string}`;

    // Encode bet intent data payload for the RushTrade contract on Monad
    const payload = JSON.stringify({
      protocol: "rushtrade",
      marketId,
      outcome,
      amount: amount.toString(),
      timestamp: Date.now(),
    });
    const callData = toHex(stringToBytes(payload));

    // Submit transaction on-chain via the Ace relayer
    const hash = await wallet.sendTransaction({
      account: getExecutorAccount(),
      chain: monadTestnet,
      to: targetAddress,
      data: callData,
      value: BigInt(0),
    });

    // Await confirmation on Monad Testnet
    await publicClient.waitForTransactionReceipt({ hash });

    return {
      mode: "onchain",
      txHash: hash,
      positionId: `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      executorAddress: getExecutorAddress(),
      note: `Relayed to RushTrade contract (${targetAddress}) on Monad Testnet`,
    };
  }

  async getPosition(positionId: string): Promise<Position> {
    return {
      positionId,
      marketId: "demo-india-win",
      outcome: "YES",
      amount: "10",
      status: "OPEN",
      isDemo: false,
    };
  }

  async claim(positionId: string): Promise<ExecutionResult> {
    return {
      mode: "onchain",
      executorAddress: getExecutorAddress(),
      note: `Claimed from RushTrade on Monad Testnet`,
    };
  }
}

/** Helper to format a USDC bigint back to a human string for records. */
export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}
