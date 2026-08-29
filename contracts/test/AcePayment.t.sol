// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AcePayment} from "../src/AcePayment.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract AcePaymentTest is Test {
    AcePayment payment;
    MockUSDC usdc;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        usdc = new MockUSDC();
        payment = new AcePayment(address(usdc));
        usdc.mint(alice, 1_000_000); // 1 USDC (6 decimals)
    }

    function test_DepositAndClaim() public {
        bytes32 id = keccak256("pay_1");
        uint256 amount = 100_000; // 0.1 USDC

        vm.startPrank(alice);
        usdc.approve(address(payment), amount);
        payment.deposit(bob, amount, id);
        vm.stopPrank();

        (address s, address r, uint256 a, bool claimed, ) = payment.getPayment(id);
        assertEq(s, alice);
        assertEq(r, bob);
        assertEq(a, amount);
        assertFalse(claimed);
        assertEq(usdc.balanceOf(address(payment)), amount);

        vm.prank(bob);
        payment.claim(id);

        (, , , bool claimedAfter, ) = payment.getPayment(id);
        assertTrue(claimedAfter);
        assertEq(usdc.balanceOf(bob), amount);
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(AcePayment.ZeroAmount.selector);
        payment.deposit(bob, 0, keccak256("z"));
    }

    function test_RevertWhen_DuplicatePaymentId() public {
        bytes32 id = keccak256("dup");
        vm.startPrank(alice);
        usdc.approve(address(payment), 200_000);
        payment.deposit(bob, 100_000, id);
        vm.expectRevert(AcePayment.PaymentExists.selector);
        payment.deposit(bob, 100_000, id);
        vm.stopPrank();
    }

    function test_RevertWhen_NotRecipientClaims() public {
        bytes32 id = keccak256("pay_2");
        vm.startPrank(alice);
        usdc.approve(address(payment), 100_000);
        payment.deposit(bob, 100_000, id);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(AcePayment.NotRecipient.selector);
        payment.claim(id);
    }

    function test_RevertWhen_DoubleClaim() public {
        bytes32 id = keccak256("pay_3");
        vm.startPrank(alice);
        usdc.approve(address(payment), 100_000);
        payment.deposit(bob, 100_000, id);
        vm.stopPrank();

        vm.startPrank(bob);
        payment.claim(id);
        vm.expectRevert(AcePayment.AlreadyClaimed.selector);
        payment.claim(id);
        vm.stopPrank();
    }
}
