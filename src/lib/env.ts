/**
 * Server-side environment validation.
 *
 * These helpers run only in Next.js server contexts (API routes / server
 * components). They must NEVER be imported into client components, because
 * they read the executor private key.
 */

export const DEMO_MODE =
  (process.env.DEMO_MODE || "true").toLowerCase() === "true";

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
 * Read + validate required server env. Throws a descriptive error listing all
 * missing/invalid variables so misconfiguration fails loudly at request time.
 */
export function getServerEnv(): ServerEnv {
  const errors: string[] = [];

  const rpcUrl =
    process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "10143");
  if (!Number.isInteger(chainId) || chainId <= 0) {
    errors.push("NEXT_PUBLIC_CHAIN_ID must be a positive integer (expected 10143)");
  }

  const executorPrivateKey = process.env.ACE_EXECUTOR_PRIVATE_KEY || "";

  const aceSettlementAddress = process.env.NEXT_PUBLIC_ACE_CONTRACT_ADDRESS || "";
  const acePaymentAddress = process.env.NEXT_PUBLIC_P2P_CONTRACT_ADDRESS || "";
  const usdcAddress = process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS || "";
  const rushTradeAddress = process.env.NEXT_PUBLIC_RUSH_TRADE_ADDRESS || "";

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
 * Validate that the executor key exists and is well-formed. Used by endpoints
 * that must submit an on-chain transaction (batch settlement, execution).
 * Never returns or logs the key value itself.
 */
export function requireExecutorKey(): `0x${string}` {
  const key = process.env.ACE_EXECUTOR_PRIVATE_KEY || "";
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
  const addr = process.env.NEXT_PUBLIC_ACE_CONTRACT_ADDRESS || "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new Error(
      "NEXT_PUBLIC_ACE_CONTRACT_ADDRESS is not a valid address. Deploy AceSettlement and set it."
    );
  }
  return addr as `0x${string}`;
}
