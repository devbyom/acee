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
      >
        <Wallet className="h-4 w-4" />
        {isPending ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  if (wrongChain) {
    return (
      <Button
        variant="destructive"
        onClick={() => switchChain({ chainId: MONAD_CHAIN_ID })}
      >
        <AlertTriangle className="h-4 w-4" />
        Switch to Monad Testnet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="mono text-sm text-foreground">{shortHash(address)}</span>
        <Balances address={address!} />
      </div>
      <Button variant="outline" size="icon" onClick={() => disconnect()} title="Disconnect">
        <LogOut className="h-4 w-4" />
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
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="secondary">{usdcBal} USDC</Badge>
      <Badge variant="secondary">{monBal} MON</Badge>
    </div>
  );
}
