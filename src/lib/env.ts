/**
 * Server-side environment validation.
 *
 * These helpers run only in Next.js server contexts (API routes / server
 * components). They must NEVER be imported into client components, because
 * they read the executor private key.
 */

export const DEMO_MODE =
  (process.env.DEMO_MODE || "false").toLowerCase() === "true";

export interface ServerEnv {
  rpcUrl: string;
  chainId: number;
  aceSettlementAddress: string;
  acePaymentAddress: string;
  usdcAddress: string;
  rushTradeAddress: string;
  executorPrivateKey: string;
  demoMode: boolean;
}

/**
 * Read + validate required server env.
 */
export function getServerEnv(): ServerEnv {
  const errors: string[] = [];

  const rpcUrl =
    process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "10143");
  if (!Number.isInteger(chainId) || chainId <= 0) {
    errors.push("NEXT_PUBLIC_CHAIN_ID must be a positive integer (expected 10143)");
  }

  const executorPrivateKey =
    process.env.ACE_EXECUTOR_PRIVATE_KEY ||
    "5afea09852363adb489bc7a46d8546b6d6fa71d6747792ea3a6cc3dfd3f205ca";

  const aceSettlementAddress =
    process.env.NEXT_PUBLIC_ACE_CONTRACT_ADDRESS ||
    "0xfd95f956d46230fdaa654813712ffbeeb4ced361";
  const acePaymentAddress =
    process.env.NEXT_PUBLIC_P2P_CONTRACT_ADDRESS ||
    "0x5deffd0be3b2dfc4cb7a9359e82a9c806f41fbda";
  const usdcAddress =
    process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS ||
    "0x534b2f3A21130d7a60830c2Df862319e593943A3";
  const rushTradeAddress =
    process.env.NEXT_PUBLIC_RUSH_TRADE_ADDRESS ||
    "0xf20d297680cd451910eaa5fc58e73824d09e4688";

  if (errors.length > 0) {
    throw new Error(`Invalid Ace server environment:\n- ${errors.join("\n- ")}`);
  }

  return {
    rpcUrl,
    chainId,
    aceSettlementAddress,
    acePaymentAddress,
    usdcAddress,
    rushTradeAddress,
    executorPrivateKey,
    demoMode: DEMO_MODE,
  };
}

/**
 * Validate that the executor key exists and is well-formed.
 */
export function requireExecutorKey(): `0x${string}` {
  const key =
    process.env.ACE_EXECUTOR_PRIVATE_KEY ||
    "5afea09852363adb489bc7a46d8546b6d6fa71d6747792ea3a6cc3dfd3f205ca";
  if (!key) {
    throw new Error(
      "ACE_EXECUTOR_PRIVATE_KEY is not set. This server-side key is required to submit transactions."
    );
  }
  const normalized = key.startsWith("0x") ? key : `0x${key}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("ACE_EXECUTOR_PRIVATE_KEY must be a 32-byte hex private key.");
  }
  return normalized as `0x${string}`;
}

export function requireSettlementAddress(): `0x${string}` {
  const addr =
    process.env.NEXT_PUBLIC_ACE_CONTRACT_ADDRESS ||
    "0xfd95f956d46230fdaa654813712ffbeeb4ced361";
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new Error(
      "NEXT_PUBLIC_ACE_CONTRACT_ADDRESS is not a valid address."
    );
  }
  return addr as `0x${string}`;
}
