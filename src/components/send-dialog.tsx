"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import {
  Check,
  Copy,
  Loader2,
  Send,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Coins,
  Lock,
} from "lucide-react";
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
import { explorerTx } from "@/lib/chain";
import { toBytes32Id } from "@/lib/commitment";
import {
  ACE_PAYMENT_ADDRESS,
  TESTNET_USDC_ADDRESS,
  USDC_DECIMALS,
  ERC20_ABI,
  ACE_PAYMENT_ABI,
} from "@/lib/contracts";

interface SendResult {
  paymentId: string;
  status: string;
  onchainTxHash?: string;
  approvalTxHash?: string;
  recipient: string;
  amount: string;
  asset: string;
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
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [recipient, setRecipient] = useState("");
  const [asset, setAsset] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepText, setStepText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Read current allowance of USDC for AcePayment contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TESTNET_USDC_ADDRESS || undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && ACE_PAYMENT_ADDRESS ? [address, ACE_PAYMENT_ADDRESS] : undefined,
    query: {
      enabled: Boolean(address && ACE_PAYMENT_ADDRESS && TESTNET_USDC_ADDRESS),
    },
  });

  function reset() {
    setRecipient("");
    setAmount("");
    setAsset("USDC");
    setError(null);
    setResult(null);
    setStepText("");
  }

  async function submit() {
    setError(null);
    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient.trim())) {
      setError("Please enter a valid recipient 0x address.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setLoading(true);
    try {
      let onchainTxHash: string | undefined = undefined;
      let approvalTxHash: string | undefined = undefined;
      const cleanRecipient = recipient.trim() as `0x${string}`;

      // If asset is USDC and we have contracts configured, execute Approve -> Escrow Deposit
      if (asset === "USDC" && ACE_PAYMENT_ADDRESS && TESTNET_USDC_ADDRESS) {
        const amountBigInt = parseUnits(amount, USDC_DECIMALS);
        const currentAllowance = (allowance as bigint) ?? BigInt(0);

        // Step 1: Check and Approve USDC if needed
        if (currentAllowance < amountBigInt) {
          setStepText("Step 1/2: Approving USDC for Escrow Contract...");
          const approveHash = await writeContractAsync({
            address: TESTNET_USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [ACE_PAYMENT_ADDRESS, amountBigInt],
          });
          approvalTxHash = approveHash;

          if (publicClient) {
            setStepText("Waiting for approval confirmation...");
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            await refetchAllowance();
          }
        }

        // Step 2: Generate payment ID & Deposit into AcePayment Escrow
        setStepText("Step 2/2: Depositing USDC into Escrow Contract...");
        const rawPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const paymentIdBytes32 = toBytes32Id(rawPaymentId);

        const depositHash = await writeContractAsync({
          address: ACE_PAYMENT_ADDRESS,
          abi: ACE_PAYMENT_ABI,
          functionName: "deposit",
          args: [cleanRecipient, amountBigInt, paymentIdBytes32],
        });
        onchainTxHash = depositHash;

        if (publicClient) {
          setStepText("Waiting for deposit confirmation on Monad...");
          await publicClient.waitForTransactionReceipt({ hash: depositHash });
        }

        // Step 3: Record in Private Ledger
        setStepText("Indexing confidential payment...");
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: rawPaymentId,
            sender: address,
            recipient: cleanRecipient,
            amount,
            asset: "USDC",
            onchainTxHash: depositHash,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to record payment");

        setResult({
          paymentId: rawPaymentId,
          status: "deposited",
          onchainTxHash: depositHash,
          approvalTxHash,
          recipient: cleanRecipient,
          amount,
          asset: "USDC",
        });
      } else {
        // Native MON / Demo mode flow
        setStepText("Submitting payment to ledger...");
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: address,
            recipient: cleanRecipient,
            amount,
            asset,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create payment");

        setResult({
          paymentId: data.paymentId,
          status: data.status,
          recipient: cleanRecipient,
          amount,
          asset,
        });
      }

      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setLoading(false);
      setStepText("");
    }
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close} className="max-w-md">
        {!result ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center bg-[#298dff]/15 text-[#298dff]"
                  style={{ borderRadius: "2px" }}
                >
                  <Send className="h-3.5 w-3.5" />
                </div>
                <DialogTitle>Transfer &amp; Escrow Assets</DialogTitle>
              </div>
              <DialogDescription>
                {asset === "USDC"
                  ? "Approves and deposits USDC into AcePayment Escrow. The recipient can claim directly to their wallet."
                  : "Private peer-to-peer transaction offloaded to the private state layer before Monad rollup."}
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

              {/* Escrow Guarantee Info Card */}
              <div
                className="border border-[#1c2026] bg-[#000000] p-3 text-xs text-text-secondary space-y-1.5"
                style={{ borderRadius: "2px" }}
              >
                <div className="flex items-center gap-1.5 font-medium text-[#54a6ff]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#298dff]" />
                  <span>
                    {asset === "USDC"
                      ? "Escrow-Secured Transfer (Approve → Deposit)"
                      : "Confidential State Execution"}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {asset === "USDC"
                    ? "Tokens are escrowed in AcePayment contract (0x5deffd...). The recipient receives a claimable allocation redeemable at any time."
                    : "The recipient and amount remain shielded inside Ace's ledger before rolling up to Monad."}
                </p>
              </div>

              {loading && stepText && (
                <div
                  className="border border-[#298dff]/30 bg-[#298dff]/10 p-2.5 flex items-center gap-2 text-xs text-[#54a6ff]"
                  style={{ borderRadius: "2px" }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-[#298dff] shrink-0" />
                  <span>{stepText}</span>
                </div>
              )}

              {error && (
                <div
                  className="border border-[#ff3d3d]/30 bg-[#ff3d3d]/10 p-2.5 text-xs text-[#ff3d3d]"
                  style={{ borderRadius: "2px" }}
                >
                  {error}
                </div>
              )}

              <Button
                className="w-full h-10 font-medium"
                onClick={submit}
                disabled={loading || !recipient || !amount}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Processing Escrow...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {asset === "USDC" ? "Approve & Send to Escrow" : "Send Confidentially"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2.5 text-[#54a6ff]">
              <div
                className="flex h-8 w-8 items-center justify-center bg-[#298dff]/20 text-[#298dff]"
                style={{ borderRadius: "2px" }}
              >
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary">
                  {result.onchainTxHash ? "Deposited to Escrow" : "Payment Created"}
                </h3>
                <p className="text-xs text-text-secondary">
                  {result.onchainTxHash
                    ? "Funds securely locked in AcePayment on Monad"
                    : "Queued for next rollup batch"}
                </p>
              </div>
            </div>

            <div
              className="border border-[#1c2026] bg-[#000000] p-3.5 space-y-2.5 text-xs"
              style={{ borderRadius: "2px" }}
            >
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

              {result.onchainTxHash && (
                <div className="border-t border-[#1c2026] pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">
                    Monad Escrow Deposit Tx
                  </div>
                  <a
                    href={explorerTx(result.onchainTxHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-xs text-[#298dff] hover:text-[#54a6ff] underline inline-flex items-center gap-1"
                  >
                    {shortHash(result.onchainTxHash, 10, 8)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="border-t border-[#1c2026] pt-2">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  Escrow Claim Status
                </div>
                <div className="mt-1">
                  <Badge variant="default" className="text-[10px]">
                    Claimable by Recipient ({shortHash(result.recipient)})
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Sent <strong className="text-text-primary">{result.amount} {result.asset}</strong> to{" "}
              <span className="mono text-[#54a6ff]">{shortHash(result.recipient)}</span>. The recipient can claim these funds at any time.
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
