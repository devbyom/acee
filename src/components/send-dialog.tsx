"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Check, Copy, Loader2, Send } from "lucide-react";
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
      setError("Connect your wallet first.");
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
              <DialogTitle>Send privately</DialogTitle>
              <DialogDescription>
                Creates a private payment intent in Ace&apos;s ledger. It settles
                on Monad later as part of a batched Merkle commitment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Recipient</Label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Asset</Label>
                  <div className="flex gap-2">
                    {["USDC", "MON"].map((a) => (
                      <button
                        key={a}
                        onClick={() => setAsset(a)}
                        className={`h-11 flex-1 rounded-lg border text-sm transition-colors ${
                          asset === a
                            ? "border-primary/50 bg-primary/15 text-primary"
                            : "border-white/10 bg-black/30 text-muted-foreground hover:bg-white/5"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-100/80">
                <Badge variant="warning" className="mb-1">
                  Testnet only
                </Badge>
                <p>
                  Ace&apos;s executor currently requires trust for settlement. The
                  private record settles as a Merkle commitment on Monad Testnet.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button className="w-full" onClick={submit} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send privately
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              <span className="text-lg font-semibold">Payment created</span>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/30 p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Payment ID
              </div>
              <div className="flex items-center gap-2">
                <span className="mono text-sm">{result.paymentId}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.paymentId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                Status
              </div>
              <Badge variant="private">Pending private settlement</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Sent {amount} {asset} to {shortHash(recipient)}. Batch it from the
              dashboard to commit the Merkle root to Monad.
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
