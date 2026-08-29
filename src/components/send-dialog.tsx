"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Check, Copy, Loader2, Send, ShieldCheck, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { shortHash } from "@/lib/utils";

interface SendResult {
  paymentId: string;
  status: string;
}

export function SendDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setRecipient("");
    setAmount("");
    setAsset("USDC");
    setError(null);
    setResult(null);
  }

  async function submit() {
    setError(null);
    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: address, recipient, amount, asset }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");
      setResult(data);
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close}>
        {!result ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
                  <Send className="h-3.5 w-3.5" />
                </div>
                <DialogTitle>Transfer Assets Privately</DialogTitle>
              </div>
              <DialogDescription>
                Confidential peer-to-peer transaction offloaded to the private state layer before Monad rollup.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-text-secondary">
                  Recipient Address
                </Label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-text-secondary">
                    Asset
                  </Label>
                  <div className="flex gap-2">
                    {["USDC", "MON"].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAsset(a)}
                        style={{ borderRadius: "2px" }}
                        className={`h-10 flex-1 border text-xs font-medium transition-all ${
                          asset === a
                            ? "border-[#298dff] bg-[#298dff]/15 text-[#54a6ff]"
                            : "border-[#1c2026] bg-[#000000] text-text-secondary hover:text-text-primary hover:border-[#1c2026]/80"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-text-secondary">
                    Amount
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="border border-[#1c2026] bg-[#000000] p-3 text-xs text-text-secondary" style={{ borderRadius: "2px" }}>
                <div className="flex items-center gap-1.5 font-medium text-[#54a6ff] mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#298dff]" />
                  <span>Confidential State Execution</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  The recipient and amount remain private inside Ace&apos;s stealth ledger. Only Merkle root commitments reach the public Monad blockchain.
                </p>
              </div>

              {error && (
                <div className="border border-[#ff3d3d]/30 bg-[#ff3d3d]/10 p-2.5 text-xs text-[#ff3d3d]" style={{ borderRadius: "2px" }}>
                  {error}
                </div>
              )}

              <Button className="w-full h-10" onClick={submit} disabled={loading || !recipient || !amount}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Confidentially</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 text-[#54a6ff]">
              <div className="flex h-8 w-8 items-center justify-center bg-[#298dff]/20 text-[#298dff]" style={{ borderRadius: "2px" }}>
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">Payment Created</h3>
                <p className="text-xs text-text-secondary">Queued for next rollup batch</p>
              </div>
            </div>

            <div className="border border-[#1c2026] bg-[#000000] p-3.5 space-y-2.5 text-xs" style={{ borderRadius: "2px" }}>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  Payment Identifier
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="mono text-xs text-[#54a6ff]">{result.paymentId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.paymentId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#298dff]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  Rollup Status
                </div>
                <div className="mt-1">
                  <Badge variant="default">Queued for Monad Commitment</Badge>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Sent <strong className="text-text-primary">{amount} {asset}</strong> to <span className="mono text-[#54a6ff]">{shortHash(recipient)}</span>.
            </p>

            <Button className="w-full" variant="outline" onClick={close}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
