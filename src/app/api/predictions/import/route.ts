import { NextRequest, NextResponse } from "next/server";
import { getAdapter, getDemoAdapter, isRushTradeConfigured } from "@/lib/adapters";
import { validateNonEmptyString } from "@/lib/validation";
import { errorResponse } from "@/lib/api";
import { DEMO_MODE } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/predictions/import
 * Body: { protocol, marketId, marketUrl }
 *
 * Reads the configured external market if possible. If the external protocol
 * is unavailable and DEMO_MODE is on, returns a clearly-labeled demo market
 * (isDemo: true) so the UI can display the DEMO banner honestly.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const protocol = (body.protocol || "rushtrade").toString();

    // Accept either an explicit marketId or derive one from a pasted URL.
    let marketId: string = body.marketId ? String(body.marketId) : "";
    const marketUrl: string | undefined = body.marketUrl
      ? String(body.marketUrl)
      : undefined;
    if (!marketId && marketUrl) {
      marketId = deriveMarketIdFromUrl(marketUrl);
    }
    marketId = validateNonEmptyString(marketId, "marketId");

    // Try the real adapter first.
    try {
      const adapter = getAdapter(protocol);
      const market = await adapter.getMarket(marketId);

      if (market.status !== "UNAVAILABLE") {
        return NextResponse.json({
          marketId: market.marketId,
          question: market.question,
          outcomes: market.outcomes,
          status: market.status,
          currentData: market.currentData ?? {},
          isDemo: market.isDemo ?? false,
          protocol: market.protocol,
        });
      }
      // Real protocol reported unavailable -> fall through to demo handling.
    } catch (e) {
      // Real adapter threw (e.g. no verified ABI). Fall through to demo.
      if (!DEMO_MODE) throw e;
    }

    if (!DEMO_MODE) {
      return NextResponse.json(
        {
          error:
            "External market is unavailable and DEMO_MODE is off. Configure NEXT_PUBLIC_RUSH_TRADE_ADDRESS with a verified contract.",
        },
        { status: 503 }
      );
    }

    // DEMO fallback — clearly labeled.
    const demo = getDemoAdapter();
    const market = await demo.getMarket(marketId);
    return NextResponse.json({
      marketId: market.marketId,
      question: market.question,
      outcomes: market.outcomes,
      status: market.status,
      currentData: market.currentData ?? {},
      isDemo: true,
      protocol: market.protocol,
      rushTradeConfigured: isRushTradeConfigured(),
      note: "DEMO MODE — external protocol not verified; showing a labeled demo market.",
    });
  } catch (err) {
    return errorResponse(err);
  }
}

function deriveMarketIdFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last || u.hostname;
  } catch {
    // Not a URL; use a normalized slug of the raw string.
    return url.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 64);
  }
}
