import { NextRequest, NextResponse } from "next/server";
import { createPayment, listTransactions } from "@/lib/ledger";
import {
  validateAddress,
  validateAmount,
  validateAsset,
} from "@/lib/validation";
import { errorResponse } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments
 * Create a private payment record in Ace's private ledger.
 * Body: { sender, recipient, amount, asset }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // `sender` is the connected user; supplied by the client for the MVP
    // (no auth system per spec).
    const sender = validateAddress(body.sender, "sender");
    const recipient = validateAddress(body.recipient, "recipient");
    const amount = validateAmount(body.amount, "amount");
    const asset = validateAsset(body.asset);

    const tx = createPayment({ sender, recipient, amount, asset });

    return NextResponse.json({
      paymentId: tx.id,
      status: tx.status,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * GET /api/payments?address=0x...
 * Return the user's private payment + prediction history from the ledger.
 */
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address") || undefined;
    const txs = listTransactions(address ?? undefined);
    return NextResponse.json({ transactions: txs });
  } catch (err) {
    return errorResponse(err);
  }
}
