"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Eye, Coins, Check } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrivacyView } from "@/components/privacy-view";
import { ClaimDialog } from "@/components/claim-dialog";
import { shortHash } from "@/lib/utils";

export function ActivityItem({
  tx,
  onClaimed,
}: {
  tx: Transaction;
  onClaimed?: () => void;
}) {
  const { address } = useAccount();
  const [inspectOpen, setInspectOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  const isPayment = tx.type === "payment";
  const isIncoming = isPayment && tx.recipient?.toLowerCase() === address?.toLowerCase();
  const isClaimable = isIncoming && !tx.claimed;

  const getStatusBadge = () => {
    if (tx.claimed) {
      return <Badge variant="success">Claimed</Badge>;
    }
    if (isClaimable) {
      return <Badge variant="default" className="bg-[#298dff] text-white">Claimable</Badge>;
    }
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
      <div
        style={{ borderRadius: "2px" }}
        className="flex w-full items-center justify-between border border-[#1c2026] bg-[#0d0f12] px-4 py-3 text-left transition-all hover:border-[#298dff]/50 hover:bg-[#131518] group"
      >
        <div
          onClick={() => setInspectOpen(true)}
          className="flex items-center gap-3 cursor-pointer flex-1 mr-2"
        >
          <div
            style={{ borderRadius: "2px" }}
            className={`flex h-8 w-8 items-center justify-center border transition-colors shrink-0 ${
              isPayment
                ? isIncoming
                  ? "border-[#54a6ff]/40 bg-[#298dff]/15 text-[#54a6ff]"
                  : "border-[#298dff]/30 bg-[#298dff]/10 text-[#54a6ff]"
                : "border-[#ff3d3d]/30 bg-[#ff3d3d]/10 text-[#ff3d3d]"
            }`}
          >
            {isPayment ? (
              isIncoming ? (
                <ArrowDownLeft className="h-4 w-4 text-[#54a6ff]" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-primary">
                {isPayment
                  ? isIncoming
                    ? "Incoming Payment (Escrow)"
                    : "Private P2P Transfer"
                  : `Prediction Market`}
              </span>
              {!isPayment && tx.outcome && (
                <span
                  className={`text-[10px] px-1 py-0.2 font-bold ${
                    tx.outcome === "YES" ? "text-[#54a6ff]" : "text-[#ff3d3d]"
                  }`}
                >
                  {tx.outcome}
                </span>
              )}
            </div>
            <div className="text-[11px] text-text-secondary mono mt-0.5">
              {isPayment
                ? isIncoming
                  ? `From ${shortHash(tx.sender)}`
                  : `To ${shortHash(tx.recipient)}`
                : `Market: ${shortHash(tx.marketId, 8, 6)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs font-semibold mono ${
                isIncoming ? "text-[#54a6ff]" : "text-text-primary"
              }`}
            >
              {isIncoming ? "+" : isPayment ? "-" : ""}
              {tx.amount} {tx.asset}
            </span>
            <div className="flex items-center gap-1.5">{getStatusBadge()}</div>
          </div>

          {isClaimable && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setClaimOpen(true);
              }}
              className="h-7 text-[11px] px-2.5 bg-[#298dff] hover:bg-[#1a7ae6] text-white shrink-0 shadow-[0_0_12px_rgba(41,141,255,0.4)]"
            >
              <Coins className="h-3 w-3 mr-1" /> Claim
            </Button>
          )}
        </div>
      </div>

      {/* Inspect Dialog */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setInspectOpen(false)}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center bg-[#298dff]/15 text-[#298dff]"
                style={{ borderRadius: "2px" }}
              >
                <Eye className="h-3.5 w-3.5" />
              </div>
              <DialogTitle>Confidential State &amp; Proof Inspector</DialogTitle>
            </div>
          </DialogHeader>
          <PrivacyView tx={tx} />
        </DialogContent>
      </Dialog>

      {/* Claim Dialog */}
      <ClaimDialog
        tx={tx}
        open={claimOpen}
        onOpenChange={setClaimOpen}
        onClaimed={() => {
          onClaimed?.();
          setClaimOpen(false);
        }}
      />
    </>
  );
}
