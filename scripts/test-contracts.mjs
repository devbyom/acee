// Live on-chain tests for the deployed Ace contracts (Monad Testnet).
// Runs with: node scripts/test-contracts.mjs
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  keccak256,
  toBytes,
  concatHex,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = "https://testnet-rpc.monad.xyz";
const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const SETTLEMENT = "0xfd95f956d46230fdaa654813712ffbeeb4ced361";
const PAYMENT = "0x5deffd0be3b2dfc4cb7a9359e82a9c806f41fbda";
const USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";

const KEY = "0x5afea09852363adb489bc7a46d8546b6d6fa71d6747792ea3a6cc3dfd3f205ca";
const account = privateKeyToAccount(KEY);

const settlementAbi = [
  { type: "function", name: "commitBatch", stateMutability: "nonpayable", inputs: [{ name: "batchId", type: "uint256" }, { name: "commitment", type: "bytes32" }], outputs: [] },
  { type: "function", name: "getBatch", stateMutability: "view", inputs: [{ name: "batchId", type: "uint256" }], outputs: [{ type: "bytes32" }, { type: "uint256" }, { type: "address" }] },
  { type: "function", name: "batchExists", stateMutability: "view", inputs: [{ name: "batchId", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "operator", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
];

const paymentAbi = [
  { type: "function", name: "token", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }, { name: "paymentId", type: "bytes32" }], outputs: [] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "paymentId", type: "bytes32" }], outputs: [] },
  { type: "function", name: "getPayment", stateMutability: "view", inputs: [{ name: "paymentId", type: "bytes32" }], outputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }, { type: "bool" }, { type: "uint256" }] },
];

const publicClient = createPublicClient({ chain: monad, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: monad, transport: http(RPC) });

let pass = 0;
let fail = 0;
function ok(name, cond, detail = "") {
  if (cond) { console.log(`  PASS  ${name}${detail ? " — " + detail : ""}`); pass++; }
  else { console.log(`  FAIL  ${name}${detail ? " — " + detail : ""}`); fail++; }
}
async function expectRevert(name, fn) {
  try {
    await fn();
    console.log(`  FAIL  ${name} — expected revert, but call succeeded`);
    fail++;
  } catch (e) {
    const msg = (e.shortMessage || e.message || "").split("\n")[0];
    console.log(`  PASS  ${name} — reverted as expected (${msg})`);
    pass++;
  }
}

console.log("=== Contract deployment sanity ===");
const code1 = await publicClient.getBytecode({ address: SETTLEMENT });
const code2 = await publicClient.getBytecode({ address: PAYMENT });
ok("AceSettlement has bytecode", Boolean(code1 && code1.length > 2));
ok("AcePayment has bytecode", Boolean(code2 && code2.length > 2));

const op = await publicClient.readContract({ address: SETTLEMENT, abi: settlementAbi, functionName: "operator" });
ok("AceSettlement.operator == executor", op.toLowerCase() === account.address.toLowerCase(), op);

const tok = await publicClient.readContract({ address: PAYMENT, abi: paymentAbi, functionName: "token" });
ok("AcePayment.token == USDC", tok.toLowerCase() === USDC.toLowerCase(), tok);

console.log("\n=== AceSettlement: commitBatch (real tx) ===");
const h1 = keccak256(toBytes("payment|0xabc||||10|1|pay_1"));
const h2 = keccak256(toBytes("prediction|0xdef||m1|YES|10|2|prd_1"));
const [l, r] = h1.toLowerCase() <= h2.toLowerCase() ? [h1, h2] : [h2, h1];
const root = keccak256(concatHex([l, r]));
const batchId = BigInt(100000 + Math.floor(Math.random() * 900000));
console.log(`  batchId=${batchId}  root=${root}`);

const existsBefore = await publicClient.readContract({ address: SETTLEMENT, abi: settlementAbi, functionName: "batchExists", args: [batchId] });
ok("batch does not exist before commit", existsBefore === false);

const commitHash = await wallet.writeContract({ account, chain: monad, address: SETTLEMENT, abi: settlementAbi, functionName: "commitBatch", args: [batchId, root] });
const commitReceipt = await publicClient.waitForTransactionReceipt({ hash: commitHash });
ok("commitBatch tx success", commitReceipt.status === "success", commitHash);

const [storedRoot, ts, storedOp] = await publicClient.readContract({ address: SETTLEMENT, abi: settlementAbi, functionName: "getBatch", args: [batchId] });
ok("stored commitment matches root", storedRoot.toLowerCase() === root.toLowerCase());
ok("stored operator == executor", storedOp.toLowerCase() === account.address.toLowerCase());
ok("stored timestamp > 0", ts > 0n, ts.toString());

console.log("\n=== AceSettlement: guards (simulate, no tx) ===");
await expectRevert("commitBatch on existing batch reverts (no overwrite)", () =>
  publicClient.simulateContract({ account, address: SETTLEMENT, abi: settlementAbi, functionName: "commitBatch", args: [batchId, keccak256(toBytes("other"))] })
);
await expectRevert("commitBatch with zero commitment reverts", () =>
  publicClient.simulateContract({ account, address: SETTLEMENT, abi: settlementAbi, functionName: "commitBatch", args: [BigInt(999999999), "0x0000000000000000000000000000000000000000000000000000000000000000"] })
);

console.log("\n=== AcePayment: guards (simulate, no tx) ===");
const someId = keccak256(toBytes("pay_test_" + Date.now()));
await expectRevert("deposit with zero amount reverts", () =>
  publicClient.simulateContract({ account, address: PAYMENT, abi: paymentAbi, functionName: "deposit", args: [account.address, 0n, someId] })
);
await expectRevert("deposit to zero address reverts", () =>
  publicClient.simulateContract({ account, address: PAYMENT, abi: paymentAbi, functionName: "deposit", args: ["0x0000000000000000000000000000000000000000", 1000n, someId] })
);
await expectRevert("claim of non-existent payment reverts", () =>
  publicClient.simulateContract({ account, address: PAYMENT, abi: paymentAbi, functionName: "claim", args: [keccak256(toBytes("nonexistent_" + Date.now()))] })
);

const [ps, pr, pa, pc] = await publicClient.readContract({ address: PAYMENT, abi: paymentAbi, functionName: "getPayment", args: [keccak256(toBytes("never_created"))] });
ok("getPayment on unknown id returns empty sender", ps === "0x0000000000000000000000000000000000000000");

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
