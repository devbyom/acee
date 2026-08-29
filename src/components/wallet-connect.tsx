"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shortHash, formatAmount } from "@/lib/utils";
import { MONAD_CHAIN_ID } from "@/lib/chain";
import { ERC20_ABI, TESTNET_USDC_ADDRESS, USDC_DECIMALS } from "@/lib/contracts";

export function WalletConnect() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const wrongChain = isConnected && chainId !== MONAD_CHAIN_ID;

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <Button
        onClick={() => injected && connect({ connector: injected })}
        disabled={isPending || !injected}
        size="sm"
        className="font-medium bg-[#298dff] hover:bg-[#1a7ae6] text-white"
      >
        <Wallet className="h-3.5 w-3.5" />
        {isPending ? "Connecting..." : "Connect"}
      </Button>
    );
  }

  if (wrongChain) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => switchChain({ chainId: MONAD_CHAIN_ID })}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Switch Network
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#298dff] animate-pulse" />
          <span className="mono text-xs text-text-primary font-medium">{shortHash(address)}</span>
        </div>
        <Balances address={address!} />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => disconnect()}
        title="Disconnect Wallet"
        className="h-8 w-8 border-[#1c2026] hover:border-[#ff3d3d]/50 hover:text-[#ff3d3d]"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function Balances({ address }: { address: `0x${string}` }) {
  const { data: mon } = useBalance({ address });
  const usdc = useReadContract({
    address: TESTNET_USDC_ADDRESS || undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: Boolean(TESTNET_USDC_ADDRESS) },
  });

  const usdcBal =
    usdc.data !== undefined
      ? formatAmount(formatUnits(usdc.data as bigint, USDC_DECIMALS), 2)
      : "—";
  const monBal = mon ? formatAmount(mon.formatted, 3) : "—";

  return (
    <div className="flex items-center gap-1 text-[11px] text-text-secondary mt-0.5">
      <span className="mono text-[#54a6ff]">{usdcBal} USDC</span>
      <span className="text-text-muted">•</span>
      <span className="mono text-text-secondary">{monBal} MON</span>
    </div>
  );
}
