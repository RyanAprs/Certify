pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

// Selects (left, right) ordering from a path bit. One quadratic constraint each.
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];
    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Recompute a Merkle root from a leaf + sibling path.
// node = Poseidon(left, right); must match frontend merkle.ts.
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
