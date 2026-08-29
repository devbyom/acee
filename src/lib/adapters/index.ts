import type { PredictionMarketAdapter } from "./types";
import { RushTradeAdapter } from "./rushtrade";
import { DemoMarketAdapter } from "./demo";
import { RUSH_TRADE_ADDRESS } from "@/lib/contracts";
import { DEMO_MODE } from "@/lib/env";

export type { PredictionMarketAdapter } from "./types";

/**
 * Resolve the adapter for a protocol.
 *
 * For the MVP we support exactly one external protocol integration
 * (RushTrade). When RushTrade is not configured with a verified contract and
 * DEMO_MODE is on, callers should fall back to the demo adapter — but that
 * fallback is decided explicitly by the caller so the "demo vs real"
 * distinction is never hidden.
 */
export function getAdapter(protocol: string): PredictionMarketAdapter {
  const p = protocol.toLowerCase();
  if (p === "rushtrade") {
    return new RushTradeAdapter(RUSH_TRADE_ADDRESS);
  }
  if (p === "demo" || p === "demo_external_market") {
    return new DemoMarketAdapter();
  }
  // Unknown protocol: only allow the demo adapter when demo mode is enabled.
  if (DEMO_MODE) return new DemoMarketAdapter();
  throw new Error(`Unsupported prediction protocol: ${protocol}`);
}

export function getDemoAdapter(): DemoMarketAdapter {
  return new DemoMarketAdapter();
}

/** Whether a real RushTrade contract is configured. */
export function isRushTradeConfigured(): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(RUSH_TRADE_ADDRESS);
}
