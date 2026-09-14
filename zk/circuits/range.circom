pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

/*
 * Range predicate over a claim-based Merkle credential.
 *
 * A credential is a set of numeric claims committed as a Merkle root
 * (leaf = Poseidon(keyHash, value, salt); node = Poseidon(left, right)).
 * This circuit proves, in zero knowledge, that ONE claim's value satisfies
 *     value >= threshold
 * and that it belongs to the credential whose root is the public output —
 * without revealing the value or the other claims.
 *
 * Public signals (snarkjs order: outputs first, then public inputs):
 *   [0] root      (output)  — must equal cert.metadataCommitment on-chain
 *   [1] keyHash   (input)   — which claim was proven
 *   [2] threshold (input)   — the minimum value proven
 *
 * Values are integers (GPA ×100, score, level, …); 16-bit range domain.
 * Depth 4 → up to 16 claims per credential (keep in sync with merkle.ts).
 */

// Selects (left, right) ordering from a path bit. One quadratic constraint each.
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];
    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

template MerkleInclusion(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component selectors[levels];
    component hashers[levels];

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== i == 0 ? leaf : hashers[i - 1].out;
        selectors[i].in[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
    }

    root <== hashers[levels - 1].out;
}

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

    // leaf = Poseidon(keyHash, value, salt)
    component leafHasher = Poseidon(3);
    leafHasher.inputs[0] <== keyHash;
    leafHasher.inputs[1] <== value;
    leafHasher.inputs[2] <== salt;

    // Merkle inclusion → root
    component mt = MerkleInclusion(levels);
    mt.leaf <== leafHasher.out;
    for (var i = 0; i < levels; i++) {
        mt.pathElements[i] <== pathElements[i];
        mt.pathIndices[i] <== pathIndices[i];
    }
    root <== mt.root;

    // Range-bound the value, then enforce value >= threshold (real constraint).
    component vbits = Num2Bits(16);
    vbits.in <== value;

    component ge = GreaterEqThan(16);
    ge.in[0] <== value;
    ge.in[1] <== threshold;
    ge.out === 1;
}

component main {public [keyHash, threshold]} = Range(4);
