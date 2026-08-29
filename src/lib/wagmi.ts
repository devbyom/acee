import { http, createConfig } from "wagmi";
// Import the injected connector directly from its module to avoid pulling in
// the full @wagmi/connectors barrel (which drags in the Coinbase/Base account
// SDK and its optional @x402/* deps that we don't use).
import { injected } from "wagmi/connectors";
import { monadTestnet, MONAD_RPC_URL } from "./chain";

/**
 * Wagmi config for Monad Testnet only (MVP is single-chain by design).
 * Uses the injected connector (MetaMask / browser wallets) to avoid
 * pulling in extra wallet SDKs.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(MONAD_RPC_URL),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
