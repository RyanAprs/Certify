pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";
include "merkle.circom";

/*
 * RANGE predicate over a claim-based Merkle credential.
 *
 * Proves ONE claim's value satisfies `value >= threshold` and that it belongs
 * to the credential whose root is the public output — without revealing the
 * value or the other claims. Also used for expiry (`validUntil >= now`).
 *
 * Public signals (snarkjs order: outputs first, then public inputs):
 *   [0] root      (output)  — must equal cert.metadataCommitment on-chain
 *   [1] keyHash   (input)   — which claim was proven
 *   [2] threshold (input)   — the minimum value proven
 *
 * Depth 4 → up to 16 claims per credential (keep in sync with merkle.ts).
 */
template Range(levels) {
    // Private
    signal input value;
    signal input salt;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Public
    signal input keyHash;
    signal input threshold;

    // Public output
    signal output root;

    component leafHasher = Poseidon(3);
    leafHasher.inputs[0] <== keyHash;
    leafHasher.inputs[1] <== value;
    leafHasher.inputs[2] <== salt;

    component mt = MerkleInclusion(levels);
    mt.leaf <== leafHasher.out;
    for (var i = 0; i < levels; i++) {
        mt.pathElements[i] <== pathElements[i];
        mt.pathIndices[i] <== pathIndices[i];
    }
    root <== mt.root;

    // Range-bound the value, then enforce value >= threshold (real constraint).
    // 32 bits so unix timestamps (expiry) fit alongside small scaled values.
    component vbits = Num2Bits(32);
    vbits.in <== value;

    component ge = GreaterEqThan(32);
    ge.in[0] <== value;
    ge.in[1] <== threshold;
    ge.out === 1;
}

component main {public [keyHash, threshold]} = Range(4);
