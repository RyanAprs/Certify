pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "merkle.circom";

/*
 * EQUALITY predicate over a claim-based Merkle credential.
 *
 * Proves that the claim `keyHash` in the credential equals `value` — i.e. that
 * `Poseidon(keyHash, value, salt)` is a leaf of the tree whose root is public.
 * The value IS revealed (that's the point: prove an exact attribute, e.g.
 * "authority == BNSP" or "skill == Welding"); the other claims and the salt
 * stay hidden. Works for numeric or string-encoded values.
 *
 * Public signals (snarkjs order: outputs first, then public inputs):
 *   [0] root    (output)  — must equal cert.metadataCommitment on-chain
 *   [1] keyHash (input)   — which claim
 *   [2] value   (input)   — the asserted value
 */
template Equality(levels) {
    // Private
    signal input salt;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // Public
    signal input keyHash;
    signal input value;

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
}

component main {public [keyHash, value]} = Equality(4);
