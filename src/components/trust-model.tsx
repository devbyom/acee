"use client";

import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TrustModel() {
  return (
    <Card className="border-[#1c2026] bg-[#0d0f12]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm text-text-primary">
            <div className="flex h-6 w-6 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            Ace Trust &amp; Privacy Architecture
          </CardTitle>
          <Badge variant="default" className="text-[10px]">
            Monad Sub-Second Finality
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 pt-1">
        <div className="border border-[#298dff]/20 bg-[#298dff]/[0.02] p-3.5" style={{ borderRadius: "2px" }}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#54a6ff]">
            <EyeOff className="h-3.5 w-3.5 text-[#298dff]" /> What Ace Conceals
          </div>
          <ul className="space-y-1.5 text-[11px] text-text-secondary">
            <li className="flex items-start gap-1.5">
              <span className="text-[#298dff]">•</span>
              <span>P2P payment sender, recipient addresses, and transfer amounts.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#298dff]">•</span>
              <span>Private prediction market bets and strategies before execution.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#298dff]">•</span>
              <span>Correlation between your connected wallet and batch rollup proofs.</span>
            </li>
          </ul>
        </div>

        <div className="border border-[#1c2026] bg-[#000000] p-3.5" style={{ borderRadius: "2px" }}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text-primary">
            <Eye className="h-3.5 w-3.5 text-text-secondary" /> What Is Committed on Monad
          </div>
          <ul className="space-y-1.5 text-[11px] text-text-secondary">
            <li className="flex items-start gap-1.5">
              <span className="text-text-muted">•</span>
              <span>Deterministic Keccak-256 Merkle roots committed to AceSettlement.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-text-muted">•</span>
              <span>Batch rollups and operator signatures on Monad Testnet.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-text-muted">•</span>
              <span>External protocol orders placed by the relayer proxy.</span>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2 border border-[#298dff]/25 bg-[#298dff]/[0.05] p-3.5" style={{ borderRadius: "2px" }}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#54a6ff] mb-1">
            <Lock className="h-3.5 w-3.5 text-[#298dff]" />
            <span>Cryptographic Commit-Reveal Guarantees</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Transactions are bundled off-chain into Merkle proofs and settled on Monad with high throughput, ensuring zero transaction strategy leaks while retaining decentralized verification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
