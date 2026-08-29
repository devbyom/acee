import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet, MONAD_RPC_URL } from "./chain";
import { requireExecutorKey } from "./env";

/**
 * Server-side executor / relayer.
 *
 * The executor private key is read from ACE_EXECUTOR_PRIVATE_KEY and is used
 * exclusively on the server. It is NEVER exposed to the client and NEVER read
 * from a NEXT_PUBLIC_* variable. This module must only be imported from API
 * routes / server code.
 */

let cachedAccount: Account | null = null;

export function getExecutorAccount(): Account {
  if (!cachedAccount) {
    cachedAccount = privateKeyToAccount(requireExecutorKey());
  }
  return cachedAccount;
}

export function getExecutorAddress(): `0x${string}` {
  return getExecutorAccount().address;
}

/** A read-only public client for Monad Testnet. */
export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: monadTestnet,
    transport: http(MONAD_RPC_URL),
  });
}

/** A wallet client bound to the executor account (server-side signing). */
export function getExecutorWalletClient(): WalletClient {
  return createWalletClient({
    account: getExecutorAccount(),
    chain: monadTestnet,
    transport: http(MONAD_RPC_URL),
  });
}
