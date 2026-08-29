import { defineChain } from "viem";

export const MONAD_CHAIN_ID = 10143;

export const MONAD_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

export const MONAD_EXPLORER_URL = "https://testnet.monadscan.com";

/**
 * Monad Testnet chain definition for viem/wagmi.
 * Chain ID 10143 per Monad developer docs.
 */
export const monadTestnet = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [MONAD_RPC_URL] },
    public: { http: [MONAD_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "MonadScan", url: MONAD_EXPLORER_URL },
  },
  testnet: true,
});

export function explorerTx(hash: string): string {
  return `${MONAD_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddress(address: string): string {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}
