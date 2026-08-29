import { NextRequest, NextResponse } from "next/server";
import { parseUnits } from "viem";
import {
  createIntent,
  getIntent,
  markIntentExecuted,
  recordPredictionTransaction,
} from "@/lib/ledger";
import { getAdapter, getDemoAdapter } from "@/lib/adapters";
import {
  validateAddress,
  validateAmount,
  validateNonEmptyString,
  validateOutcome,
  ValidationError,
} from "@/lib/validation";
import { errorResponse } from "@/lib/api";
import { DEMO_MODE } from "@/lib/env";
import { USDC_DECIMALS } from "@/lib/contracts";
import type { ExecutionRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/predictions/execute
 *
 * Backend executor/relayer flow:
 *   user intent -> validate -> confirm market open -> validate amount
 *   -> execute via external adapter (or labeled demo) -> record -> return
 *
 * The executor private key is used only server-side (never returned/exposed).
 * We refuse to fabricate blockchain activity: demo executions carry mode:"demo"
 * and NO txHash.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userAddress = validateAddress(body.userAddress, "userAddress");
    const marketId = validateNonEmptyString(body.marketId, "marketId");
    const outcome = validateOutcome(body.outcome);
    const amount = validateAmount(body.amount, "amount");
    const protocol = (body.protocol || "rushtrade").toString();

    // 1) Resolve or create the intent, then guard against duplicate execution.
    let intentId: string | undefined = body.intentId
      ? String(body.intentId)
      : undefined;

    if (intentId) {
      const existing = getIntent(intentId);
      if (!existing) throw new ValidationError("intentId not found.");
      if (existing.executed) {
        throw new ValidationError("This intent has already been executed.");
      }
    } else {
      const intent = createIntent({
        userAddress,
        marketProtocol: protocol,
        marketId,
        outcome,
        amount,
      });
      intentId = intent.id;
    }

    // 2) Validate the market is open (via the appropriate adapter).
    const amountUnits = parseUnits(amount, USDC_DECIMALS);
    let usingDemo = false;
    let adapter = getAdapter(protocol);

    let market;
    try {
      market = await adapter.getMarket(marketId);
    } catch (e) {
      if (!DEMO_MODE) throw e;
      usingDemo = true;
      adapter = getDemoAdapter();
      market = await adapter.getMarket(marketId);
    }

    if (market.status === "UNAVAILABLE") {
      if (!DEMO_MODE) {
        throw new ValidationError(
          "External market is unavailable and DEMO_MODE is off."
        );
      }
      usingDemo = true;
      adapter = getDemoAdapter();
      market = await adapter.getMarket(marketId);
    }

    if (market.status !== "OPEN") {
      throw new ValidationError(`Market is not open (status: ${market.status}).`);
    }

    // 3) Execute through the adapter (real on-chain if configured, else labeled demo).
    let result;
    try {
      result = await adapter.placeBet(marketId, outcome, amountUnits);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "RUSHTRADE_UNAVAILABLE_USE_DEMO" && DEMO_MODE) {
        usingDemo = true;
        result = await getDemoAdapter().placeBet(marketId, outcome, amountUnits);
      } else {
        throw e;
      }
    }

    // 4) Record the transaction with an honest execution record.
    const execution: ExecutionRecord = {
      mode: result.mode,
      protocol: usingDemo ? "DEMO_EXTERNAL_MARKET" : protocol,
      marketId,
      outcome,
      amount,
      txHash: result.mode === "onchain" ? result.txHash : undefined,
      executorAddress: result.executorAddress,
      positionId: result.positionId,
      note: result.note,
      timestamp: Date.now(),
    };

    const tx = recordPredictionTransaction({
      sender: userAddress,
      marketId,
      outcome,
      amount,
      asset: "USDC",
      execution,
    });

    markIntentExecuted(intentId);

    return NextResponse.json({
      transactionId: tx.id,
      intentId,
      market: {
        marketId: market.marketId,
        question: market.question,
        outcome,
      },
      execution,
      // Explicit, honest flags for the UI:
      isDemo: result.mode === "demo",
      demoLabel:
        result.mode === "demo"
          ? "DEMO MODE — NOT AN ON-CHAIN BET"
          : undefined,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
