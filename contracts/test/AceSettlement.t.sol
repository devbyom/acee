// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AceSettlement} from "../src/AceSettlement.sol";

contract AceSettlementTest is Test {
    AceSettlement settlement;
    address operator = address(0xABCD);
    address stranger = address(0xBEEF);

    function setUp() public {
        settlement = new AceSettlement(operator);
    }

    function test_OperatorSet() public view {
        assertEq(settlement.operator(), operator);
    }

    function test_CommitBatch() public {
        bytes32 root = keccak256("merkle-root");
        vm.prank(operator);
        settlement.commitBatch(42, root);

        (bytes32 commitment, uint256 ts, address op) = settlement.getBatch(42);
        assertEq(commitment, root);
        assertEq(op, operator);
        assertGt(ts, 0);
        assertTrue(settlement.batchExists(42));
    }

    function test_RevertWhen_NotOperator() public {
        vm.prank(stranger);
        vm.expectRevert(AceSettlement.NotOperator.selector);
        settlement.commitBatch(1, keccak256("x"));
    }

    function test_RevertWhen_Overwriting() public {
        vm.startPrank(operator);
        settlement.commitBatch(1, keccak256("a"));
        vm.expectRevert(AceSettlement.BatchAlreadyExists.selector);
        settlement.commitBatch(1, keccak256("b"));
        vm.stopPrank();
    }

    function test_RevertWhen_ZeroCommitment() public {
        vm.prank(operator);
        vm.expectRevert(AceSettlement.ZeroCommitment.selector);
        settlement.commitBatch(1, bytes32(0));
    }

    function test_TransferOperator() public {
        vm.prank(operator);
        settlement.transferOperator(stranger);
        assertEq(settlement.operator(), stranger);
    }
}
