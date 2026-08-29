import { NextResponse } from "next/server";
import { DEMO_MODE } from "@/lib/env";
import { isRushTradeConfigured } from "@/lib/adapters";
import { getExecutorAddress } from "@/lib/executor";
import {
  ACE_SETTLEMENT_ADDRESS,
  ACE_PAYMENT_ADDRESS,
  TESTNET_USDC_ADDRESS,
  RUSH_TRADE_ADDRESS,
} from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/config
 * Public, non-secret runtime configuration for the client UI.
 * The executor ADDRESS is public (it's an on-chain address); the executor
 * private KEY is never exposed.
 */
export async function GET() {
  let executorAddress: string | null = null;
  let executorConfigured = false;
  try {
    executorAddress = getExecutorAddress();
    executorConfigured = true;
  } catch {
    executorConfigured = false;
  }

  return NextResponse.json({
    demoMode: DEMO_MODE,
    rushTradeConfigured: isRushTradeConfigured(),
    settlementAddress: ACE_SETTLEMENT_ADDRESS || null,
    paymentAddress: ACE_PAYMENT_ADDRESS || null,
    usdcAddress: TESTNET_USDC_ADDRESS || null,
    rushTradeAddress: RUSH_TRADE_ADDRESS || null,
    executorAddress,
    executorConfigured,
  });
}
