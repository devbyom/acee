// Foundry-free deployment for Windows: compiles with solc-js and deploys via viem.
// Usage (env vars required):
//   ACE_EXECUTOR_PRIVATE_KEY, NEXT_PUBLIC_TESTNET_USDC_ADDRESS
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { loadSolc } from "./solc/minwrap.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const RPC = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

// ---- Load solc from the standalone soljson binary ----
const solc = loadSolc();
console.log("solc version:", solc.version());

function readContract(rel) {
  return readFileSync(resolve(root, rel), "utf8");
}

const sources = {
  "AceSettlement.sol": { content: readContract("contracts/src/AceSettlement.sol") },
  "AcePayment.sol": { content: readContract("contracts/src/AcePayment.sol") },
};

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors) {
  const fatal = output.errors.filter((e) => e.severity === "error");
  for (const e of output.errors) console.log(e.formattedMessage);
  if (fatal.length) {
    console.error("Compilation failed.");
    process.exit(1);
  }
}

function artifact(file, name) {
  const c = output.contracts[file][name];
  return { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
}

const settlementArt = artifact("AceSettlement.sol", "AceSettlement");
const paymentArt = artifact("AcePayment.sol", "AcePayment");

// ---- Deploy ----
const raw = process.env.ACE_EXECUTOR_PRIVATE_KEY;
if (!raw) throw new Error("ACE_EXECUTOR_PRIVATE_KEY not set");
const key = raw.startsWith("0x") ? raw : `0x${raw}`;
const account = privateKeyToAccount(key);

const usdc = getAddress(process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS);

const publicClient = createPublicClient({ chain: monad, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: monad, transport: http(RPC) });

console.log("\nDeployer/operator:", account.address);
console.log("USDC token:       ", usdc);

async function deploy(name, art, args) {
  console.log(`\nDeploying ${name}...`);
  const hash = await wallet.deployContract({
    abi: art.abi,
    bytecode: art.bytecode,
    args,
  });
  console.log(`  tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${name} deploy reverted`);
  console.log(`  ${name} deployed at: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

const settlementAddr = await deploy("AceSettlement", settlementArt, [account.address]);
const paymentAddr = await deploy("AcePayment", paymentArt, [usdc]);

console.log("\n=== DEPLOYMENT COMPLETE (Monad Testnet, chain 10143) ===");
console.log("NEXT_PUBLIC_ACE_CONTRACT_ADDRESS=" + settlementAddr);
console.log("NEXT_PUBLIC_P2P_CONTRACT_ADDRESS=" + paymentAddr);
console.log("Operator/Executor: " + account.address);
