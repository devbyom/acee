// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AceSettlement
/// @notice Stores cryptographic commitments (Merkle roots) for private Ace batches.
///         It intentionally does NOT store any individual private transaction.
///         Only the Merkle root (the commitment) is published on-chain, so the
///         public settlement layer exposes the minimum necessary information.
contract AceSettlement {
    struct Batch {
        bytes32 commitment;
        uint256 timestamp;
        address operator;
        bool exists;
    }

    /// @notice The single authorized operator (Ace executor) allowed to commit batches.
    address public operator;

    /// @dev batchId => Batch
    mapping(uint256 => Batch) private _batches;

    event BatchCommitted(
        uint256 indexed batchId,
        bytes32 indexed commitment,
        address indexed operator
    );

    event OperatorTransferred(address indexed previousOperator, address indexed newOperator);

    error NotOperator();
    error BatchAlreadyExists();
    error ZeroCommitment();
    error ZeroAddress();

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    constructor(address initialOperator) {
        if (initialOperator == address(0)) revert ZeroAddress();
        operator = initialOperator;
        emit OperatorTransferred(address(0), initialOperator);
    }

    /// @notice Commit a batch commitment (Merkle root) for a given batch id.
    /// @dev Prevents overwriting an existing batch. Operator-only.
    function commitBatch(uint256 batchId, bytes32 commitment) external onlyOperator {
        if (commitment == bytes32(0)) revert ZeroCommitment();
        if (_batches[batchId].exists) revert BatchAlreadyExists();

        _batches[batchId] = Batch({
            commitment: commitment,
            timestamp: block.timestamp,
            operator: msg.sender,
            exists: true
        });

        emit BatchCommitted(batchId, commitment, msg.sender);
    }

    /// @notice Read a stored batch commitment.
    function getBatch(uint256 batchId)
        external
        view
        returns (bytes32 commitment, uint256 timestamp, address batchOperator)
    {
        Batch storage b = _batches[batchId];
        return (b.commitment, b.timestamp, b.operator);
    }

    /// @notice Whether a batch id has already been committed.
    function batchExists(uint256 batchId) external view returns (bool) {
        return _batches[batchId].exists;
    }

    /// @notice Transfer the operator role (e.g. rotate the executor wallet).
    function transferOperator(address newOperator) external onlyOperator {
        if (newOperator == address(0)) revert ZeroAddress();
        address prev = operator;
        operator = newOperator;
        emit OperatorTransferred(prev, newOperator);
    }
}
