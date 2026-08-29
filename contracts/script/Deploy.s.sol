// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AceSettlement} from "../src/AceSettlement.sol";
import {AcePayment} from "../src/AcePayment.sol";

/// @notice Deploys AceSettlement and AcePayment to Monad Testnet.
///
/// Required env vars:
///   ACE_EXECUTOR_PRIVATE_KEY          - deployer + operator/executor key
///   NEXT_PUBLIC_TESTNET_USDC_ADDRESS  - testnet USDC address for AcePayment
///
/// Usage:
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url $NEXT_PUBLIC_MONAD_RPC_URL \
///     --broadcast
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("ACE_EXECUTOR_PRIVATE_KEY");
        address usdc = vm.envAddress("NEXT_PUBLIC_TESTNET_USDC_ADDRESS");
        address operator = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        AceSettlement settlement = new AceSettlement(operator);
        AcePayment payment = new AcePayment(usdc);

        vm.stopBroadcast();

        console.log("=== Ace deployment (Monad Testnet) ===");
        console.log("Operator/Executor:        ", operator);
        console.log("USDC token:               ", usdc);
        console.log("AceSettlement:            ", address(settlement));
        console.log("AcePayment:               ", address(payment));
        console.log("");
        console.log("Add these to your .env.local:");
        console.log("NEXT_PUBLIC_ACE_CONTRACT_ADDRESS=", address(settlement));
        console.log("NEXT_PUBLIC_P2P_CONTRACT_ADDRESS=", address(payment));
    }
}
