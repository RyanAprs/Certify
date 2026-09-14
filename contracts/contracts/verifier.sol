// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

/**
 * ⚠️  PLACEHOLDER VERIFIER — NOT A REAL PROOF VERIFIER  ⚠️
 *
 * This file is a stand-in so the project compiles before the ZK artifacts are
 * built. The REAL Groth16 verifier is generated from the circuit by:
 *
 *     cd zk && ./build.sh
 *
 * which overwrites this file with snarkjs' output (also named
 * `Groth16Verifier`, matching the interface below: 2 public signals
 * [commitment, minGpa]).
 *
 * Until you run the build, `verifyProof` returns false, so on-chain ZK
 * verification safely fails instead of accepting bogus proofs.
 */
contract Groth16Verifier {
    function verifyProof(
        uint[2] calldata,
        uint[2][2] calldata,
        uint[2] calldata,
        uint[2] calldata
    ) public pure returns (bool) {
        return false;
    }
}
