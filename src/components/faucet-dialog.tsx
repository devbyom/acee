"use client";

import { useState } from "react";
import { Coins, Check, ExternalLink, Sparkles, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FaucetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copiedRpc, setCopiedRpc] = useState(false);

  const copyRpc = () => {
    navigator.clipboard.writeText("https://testnet-rpc.monad.xyz");
    setCopiedRpc(true);
    setTimeout(() => setCopiedRpc(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
              <Coins className="h-3.5 w-3.5" />
            </div>
            <DialogTitle>Monad Testnet Resources</DialogTitle>
          </div>
          <DialogDescription>
            Acquire testnet MON and USDC tokens to test Ace private transfers and prediction markets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 pt-1">
          {/* Network details card */}
          <div className="border border-[#1c2026] bg-[#000000] p-3.5 space-y-2 text-xs" style={{ borderRadius: "2px" }}>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Network:</span>
              <span className="font-medium text-text-primary">Monad Testnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Chain ID:</span>
              <span className="mono font-medium text-[#54a6ff]">10143</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Currency:</span>
              <span className="font-medium text-text-primary">MON</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1c2026]">
              <span className="text-text-secondary">RPC:</span>
              <button
                onClick={copyRpc}
                className="mono text-[#298dff] flex items-center gap-1 hover:underline text-[11px]"
              >
                {copiedRpc ? <Check className="h-3 w-3 text-[#298dff]" /> : <Copy className="h-3 w-3" />}
                testnet-rpc.monad.xyz
              </button>
            </div>
          </div>

          {/* Faucet Links */}
          <div className="space-y-2">
            <a
              href="https://faucet.monad.xyz"
              target="_blank"
              rel="noreferrer"
              style={{ borderRadius: "2px" }}
              className="flex items-center justify-between p-3 border border-[#1c2026] bg-[#0d0f12] hover:border-[#298dff]/50 hover:bg-[#298dff]/5 transition-all group"
            >
              <div>
                <div className="text-xs font-medium text-text-primary group-hover:text-[#54a6ff] flex items-center gap-1.5">
                  Official Monad Faucet <ExternalLink className="h-3 w-3 opacity-60" />
                </div>
                <div className="text-[10px] text-text-secondary">Claim testnet MON for gas</div>
              </div>
              <Badge variant="default" className="text-[10px]">MON Faucet</Badge>
            </a>

            <div className="border border-[#298dff]/25 bg-[#298dff]/[0.05] p-3 text-xs text-text-secondary" style={{ borderRadius: "2px" }}>
              <div className="flex items-center gap-1.5 font-medium text-[#54a6ff] mb-0.5">
                <Sparkles className="h-3.5 w-3.5 text-[#298dff]" />
                <span>Instant Demo Mode</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                You can also use the app immediately in Demo Mode without connecting external funds.
              </p>
            </div>
          </div>

          <Button className="w-full" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
