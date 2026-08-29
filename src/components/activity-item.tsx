"use client";

import { useState } from "react";
import { ArrowUpRight, TrendingUp, Eye } from "lucide-react";
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isPayment ? "bg-primary/15 text-primary" : "bg-violet-500/15 text-violet-300"
            }`}
          >
            {isPayment ? <ArrowUpRight className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
          </div>
          <div>
            <div className="text-sm font-medium">
              {isPayment ? "P2P Payment" : `Prediction · ${tx.outcome}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {isPayment
                ? `to ${shortHash(tx.recipient)}`
                : `market ${shortHash(tx.marketId, 6, 4)}`}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-medium">
            {isPayment ? "-" : ""}
            {tx.amount} {tx.asset}
          </span>
          {tx.type === "prediction" && tx.execution?.mode === "demo" ? (
            <Badge variant="warning">Demo</Badge>
          ) : isPayment ? (
            <Badge variant="private">Private</Badge>
          ) : (
            <Badge variant="private">Private execution</Badge>
          )}
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Transaction privacy view
            </DialogTitle>
          </DialogHeader>
          <PrivacyView tx={tx} />
        </DialogContent>
      </Dialog>
    </>
  );
}
