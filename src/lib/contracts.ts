/**
 * Contract addresses (from env) and ABIs shared by frontend + backend.
 * Addresses are read from NEXT_PUBLIC_* so both client and server can use them.
 */

export const ACE_SETTLEMENT_ADDRESS = (process.env
  .NEXT_PUBLIC_ACE_CONTRACT_ADDRESS || "") as `0x${string}` | "";

export const ACE_PAYMENT_ADDRESS = (process.env
  .NEXT_PUBLIC_P2P_CONTRACT_ADDRESS || "") as `0x${string}` | "";

export const TESTNET_USDC_ADDRESS = (process.env
  .NEXT_PUBLIC_TESTNET_USDC_ADDRESS || "") as `0x${string}` | "";

export const RUSH_TRADE_ADDRESS = (process.env
  .NEXT_PUBLIC_RUSH_TRADE_ADDRESS || "") as `0x${string}` | "";

// Circle testnet USDC uses 6 decimals.
export const USDC_DECIMALS = 6;

/** ABI for AceSettlement.sol (commitment store). */
export const ACE_SETTLEMENT_ABI = [
  {
    type: "function",
    name: "commitBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint256" },
      { name: "commitment", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getBatch",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint256" }],
    outputs: [
      { name: "commitment", type: "bytes32" },
      { name: "timestamp", type: "uint256" },
      { name: "operator", type: "address" },
    ],
  },
  {
    type: "function",
    name: "operator",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "BatchCommitted",
    inputs: [
      { name: "batchId", type: "uint256", indexed: true },
      { name: "commitment", type: "bytes32", indexed: true },
      { name: "operator", type: "address", indexed: true },
    ],
    anonymous: false,
  },
] as const;

/** ABI for AcePayment.sol (P2P escrow). */
export const ACE_PAYMENT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "paymentId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "paymentId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getPayment",
    stateMutability: "view",
    inputs: [{ name: "paymentId", type: "bytes32" }],
    outputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "claimed", type: "bool" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "PaymentCreated",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PaymentClaimed",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

/** Minimal ERC-20 ABI for USDC balance/approve/transfer. */
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
