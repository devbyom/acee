import { formatUnits } from "viem";
import type { PredictionMarketAdapter } from "./types";
import type { Market, Quote, Position, ExecutionResult } from "@/lib/types";
import { USDC_DECIMALS } from "@/lib/contracts";
import { DEMO_MODE } from "@/lib/env";
import { getExecutorAddress } from "@/lib/executor";

/**
 * RushTradeAdapter
 *
 * Wraps the (external) RushTrade prediction market on Monad Testnet.
 *
 * IMPORTANT HONESTY NOTE:
 * At build time, RushTrade did not expose a publicly verifiable deployed
 * contract address or ABI that we could confirm. Ace does NOT invent contract
 * functions. Therefore:
 *
 *   - If NEXT_PUBLIC_RUSH_TRADE_ADDRESS is NOT set, the adapter reports the
 *     external market as UNAVAILABLE. When DEMO_MODE=true, callers may fall
 *     back to the clearly-labeled DEMO_EXTERNAL_MARKET (see demo.ts) instead.
 *   - If a real, verified RushTrade address + ABI is later provided, wire the
 *     real reads/writes into the marked sections below. Until then, placeBet
 *     will NOT fabricate a transaction and will throw when demo mode is off.
 */
export class RushTradeAdapter implements PredictionMarketAdapter {
  readonly protocol = "rushtrade";
  private readonly address: string;

  constructor(address: string) {
    this.address = address;
  }

  private available(): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(this.address);
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
          reason:
            "NEXT_PUBLIC_RUSH_TRADE_ADDRESS is not set to a verified RushTrade contract. Ace will not invent an on-chain interface.",
        },
      };
    }

    // === REAL INTEGRATION POINT ===
    // With a verified RushTrade ABI, read the market here via a public client:
    //   const client = getPublicClient();
    //   const data = await client.readContract({ address, abi: RUSH_TRADE_ABI, functionName: "getMarket", args: [marketId] });
    // Then map `data` into the Market shape below.
    throw new Error(
      "RushTrade contract is configured but no verified ABI/read mapping is implemented. " +
        "Provide the real ABI to enable live reads."
    );
  }

  async getQuote(marketId: string, outcome: string, amount: bigint): Promise<Quote> {
    if (!this.available()) {
      throw new Error("RushTrade unavailable: no verified contract configured.");
    }
    // === REAL INTEGRATION POINT === read a live quote from RushTrade.
    throw new Error("RushTrade quote read not implemented (needs verified ABI).");
  }

  async placeBet(marketId: string, outcome: string, amount: bigint): Promise<ExecutionResult> {
    if (!this.available()) {
      // Do NOT fabricate a transaction. Signal unavailability so the caller can
      // decide whether to use the labeled demo path (only when DEMO_MODE=true).
      if (DEMO_MODE) {
        throw new Error("RUSHTRADE_UNAVAILABLE_USE_DEMO");
      }
      throw new Error(
        "RushTrade is not configured and DEMO_MODE is off. Refusing to fabricate an on-chain bet."
      );
    }

    // === REAL INTEGRATION POINT ===
    // With a verified ABI, submit the bet from the executor wallet:
    //   const wallet = getExecutorWalletClient();
    //   const hash = await wallet.writeContract({ address, abi, functionName: "placeBet", args: [...] });
    //   const receipt = await getPublicClient().waitForTransactionReceipt({ hash });
    //   return { mode: "onchain", txHash: hash, executorAddress: getExecutorAddress() };
    throw new Error("RushTrade placeBet not implemented (needs verified ABI).");
  }

  async getPosition(positionId: string): Promise<Position> {
    throw new Error("RushTrade getPosition not implemented (needs verified ABI).");
  }

  async claim(positionId: string): Promise<ExecutionResult> {
    throw new Error("RushTrade claim not implemented (needs verified ABI).");
  }
}

/** Helper to format a USDC bigint back to a human string for records. */
export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}
