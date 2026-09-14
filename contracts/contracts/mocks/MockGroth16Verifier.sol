// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title MockGroth16Verifier
 * @notice Test-only verifier with a toggleable result, so the registry's
 *         verification logic (commitment binding, replay protection, events)
 *         can be unit-tested without generating real Groth16 proofs.
 *         DO NOT DEPLOY TO ANY REAL NETWORK.
 */
contract MockGroth16Verifier {
    bool public result = true;

    function setResult(bool value) external {
        result = value;
    }

    function verifyProof(
        uint[2] calldata,
        uint[2][2] calldata,
        uint[2] calldata,
        uint[2] calldata
    ) external view returns (bool) {
        return result;
    }
}
