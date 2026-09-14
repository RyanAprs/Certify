pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "merkle.circom";

/*
 * SET-MEMBERSHIP predicate over a claim-based Merkle credential.
 *
 * Proves that a claim's value is one of an allowed SET, without revealing which:
 *   1. leaf = Poseidon(keyHash, value, salt) is in the credential tree (root).
 *   2. value is a leaf of the allowed-set tree (public setRoot).
 *
 * The verifier builds the set tree from the values it allows and publishes
 * setRoot; the prover proves inclusion in it while hiding which element matched.
 *
 * Public signals (snarkjs order: outputs first, then public inputs):
 *   [0] root    (output)  — must equal cert.metadataCommitment on-chain
 *   [1] keyHash (input)   — which claim
 *   [2] setRoot (input)   — Merkle root of the allowed value set
 *
 * credLevels 4 (≤16 claims) · setLevels 3 (≤8 allowed values).
 */
template Membership(credLevels, setLevels) {
    // Private
    signal input value;
    signal input salt;
    signal input credPathElements[credLevels];
    signal input credPathIndices[credLevels];
    signal input setPathElements[setLevels];
    signal input setPathIndices[setLevels];

    // Public
    signal input keyHash;
    signal input setRoot;

    // Public output
    signal output root;

    // 1. Credential inclusion → root
    component leafHasher = Poseidon(3);
    leafHasher.inputs[0] <== keyHash;
    leafHasher.inputs[1] <== value;
    leafHasher.inputs[2] <== salt;

    component credMT = MerkleInclusion(credLevels);
    credMT.leaf <== leafHasher.out;
    for (var i = 0; i < credLevels; i++) {
        credMT.pathElements[i] <== credPathElements[i];
        credMT.pathIndices[i] <== credPathIndices[i];
    }
    root <== credMT.root;

    // 2. Set inclusion: `value` is a leaf of the allowed-set tree.
    component setMT = MerkleInclusion(setLevels);
    setMT.leaf <== value;
    for (var i = 0; i < setLevels; i++) {
        setMT.pathElements[i] <== setPathElements[i];
        setMT.pathIndices[i] <== setPathIndices[i];
    }
    setRoot === setMT.root;
}

component main {public [keyHash, setRoot]} = Membership(4, 3);
