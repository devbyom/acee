"use client";

import { useState } from "react";
import { ArrowUpRight, TrendingUp, Eye, CheckCircle2, Clock } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrivacyView } from "@/components/privacy-view";
import { shortHash } from "@/lib/utils";

export function ActivityItem({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);
  const isPayment = tx.type === "payment";

  const getStatusBadge = () => {
    if (tx.status === "confirmed") {
      return <Badge variant="success">Settled</Badge>;
    }
    if (tx.status === "batched") {
      return <Badge variant="default">Batched</Badge>;
    }
    if (tx.status === "submitted") {
      return <Badge variant="default">Submitted</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ borderRadius: "2px" }}
        className="flex w-full items-center justify-between border border-[#1c2026] bg-[#0d0f12] px-4 py-3 text-left transition-all hover:border-[#298dff]/50 hover:bg-[#131518] group"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ borderRadius: "2px" }}
            className={`flex h-8 w-8 items-center justify-center border transition-colors ${
              isPayment
                ? "border-[#298dff]/30 bg-[#298dff]/10 text-[#54a6ff] group-hover:bg-[#298dff]/20"
                : "border-[#ff3d3d]/30 bg-[#ff3d3d]/10 text-[#ff3d3d] group-hover:bg-[#ff3d3d]/20"
            }`}
          >
            {isPayment ? <ArrowUpRight className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-primary">
                {isPayment ? "Private P2P Transfer" : `Prediction Market`}
              </span>
              {!isPayment && tx.outcome && (
                <span className={`text-[10px] px-1 py-0.2 font-bold ${tx.outcome === 'YES' ? 'text-[#54a6ff]' : 'text-[#ff3d3d]'}`}>
                  {tx.outcome}
                </span>
              )}
            </div>
            <div className="text-[11px] text-text-secondary mono mt-0.5">
              {isPayment
                ? `To ${shortHash(tx.recipient)}`
                : `Market: ${shortHash(tx.marketId, 8, 6)}`}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-semibold mono text-text-primary">
            {isPayment ? "-" : ""}
            {tx.amount} {tx.asset}
          </span>
          <div className="flex items-center gap-1.5">
            {getStatusBadge()}
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
                <Eye className="h-3.5 w-3.5" />
              </div>
              <DialogTitle>Confidential State &amp; Proof Inspector</DialogTitle>
            </div>
          </DialogHeader>
          <PrivacyView tx={tx} />
        </DialogContent>
      </Dialog>
    </>
  );
}
