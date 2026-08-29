import { NextRequest, NextResponse } from "next/server";
import { createPayment, listTransactions, markPaymentClaimed } from "@/lib/ledger";
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
 * Body: { id?, sender, recipient, amount, asset, onchainTxHash? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sender = validateAddress(body.sender, "sender");
    const recipient = validateAddress(body.recipient, "recipient");
    const amount = validateAmount(body.amount, "amount");
    const asset = validateAsset(body.asset);

    const tx = createPayment({
      id: typeof body.id === "string" ? body.id : undefined,
      sender,
      recipient,
      amount,
      asset,
      onchainTxHash: typeof body.onchainTxHash === "string" ? body.onchainTxHash : undefined,
    });

    return NextResponse.json({
      paymentId: tx.id,
      status: tx.status,
      claimed: tx.claimed,
      onchainTxHash: tx.onchainTxHash,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/payments
 * Mark a payment as claimed by recipient.
 * Body: { paymentId, claimTxHash? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
    }
    const tx = markPaymentClaimed(body.paymentId, body.claimTxHash);
    if (!tx) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, transaction: tx });
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
