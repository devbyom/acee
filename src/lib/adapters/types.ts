import type { Market, Quote, Position, ExecutionResult } from "@/lib/types";

/**
 * The external prediction-market adapter contract.
 *
 * Ace does NOT create prediction markets. An adapter wraps an *existing*
 * external protocol so Ace can read a market, quote an outcome, and execute a
 * position through Ace's executor wallet. Every adapter must be honest about
 * whether an execution is a real on-chain transaction or a labeled demo.
 */
export interface PredictionMarketAdapter {
  readonly protocol: string;

  getMarket(marketId: string): Promise<Market>;

  getQuote(marketId: string, outcome: string, amount: bigint): Promise<Quote>;

  /**
   * Execute a bet through the external protocol using Ace's executor wallet.
   * MUST NOT fabricate a transaction hash. If the protocol is unavailable and
   * demo mode is off, this should throw.
   */
  placeBet(marketId: string, outcome: string, amount: bigint): Promise<ExecutionResult>;

  getPosition(positionId: string): Promise<Position>;

  claim(positionId: string): Promise<ExecutionResult>;
}
