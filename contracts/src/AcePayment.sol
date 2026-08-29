// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Minimal ERC-20 interface (no external deps needed).
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title AcePayment
/// @notice The simplest possible P2P payment / escrow flow, denominated in a
///         single testnet ERC-20 (USDC). A sender deposits funds tagged with a
///         paymentId; the designated recipient later claims them.
/// @dev The token is fixed at deploy time to keep the surface area minimal.
contract AcePayment {
    /// @notice The ERC-20 token used for payments (testnet USDC).
    IERC20 public immutable token;

    struct Payment {
        address sender;
        address recipient;
        uint256 amount;
        bool claimed;
        uint256 timestamp;
        bool exists;
    }

    /// @dev paymentId => Payment
    mapping(bytes32 => Payment) private _payments;

    event PaymentCreated(
        bytes32 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );

    event PaymentClaimed(
        bytes32 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );

    error PaymentExists();
    error PaymentNotFound();
    error AlreadyClaimed();
    error NotRecipient();
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();

    constructor(address usdc) {
        if (usdc == address(0)) revert ZeroAddress();
        token = IERC20(usdc);
    }

    /// @notice Escrow `amount` of USDC for `recipient`, keyed by `paymentId`.
    /// @dev Caller must have approved this contract for `amount` beforehand.
    function deposit(address recipient, uint256 amount, bytes32 paymentId) external {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (_payments[paymentId].exists) revert PaymentExists();

        _payments[paymentId] = Payment({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            claimed: false,
            timestamp: block.timestamp,
            exists: true
        });

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();

        emit PaymentCreated(paymentId, msg.sender, recipient, amount);
    }

    /// @notice Claim an escrowed payment. Only the designated recipient may claim.
    function claim(bytes32 paymentId) external {
        Payment storage p = _payments[paymentId];
        if (!p.exists) revert PaymentNotFound();
        if (p.claimed) revert AlreadyClaimed();
        if (msg.sender != p.recipient) revert NotRecipient();

        p.claimed = true;

        bool ok = token.transfer(p.recipient, p.amount);
        if (!ok) revert TransferFailed();

        emit PaymentClaimed(paymentId, p.recipient, p.amount);
    }

    /// @notice Read a stored payment.
    function getPayment(bytes32 paymentId)
        external
        view
        returns (address sender, address recipient, uint256 amount, bool claimed, uint256 timestamp)
    {
        Payment storage p = _payments[paymentId];
        return (p.sender, p.recipient, p.amount, p.claimed, p.timestamp);
    }
}
