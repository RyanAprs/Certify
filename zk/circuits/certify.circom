pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/*
 * Certify — selective GPA disclosure.
 *
 * Proves, in zero knowledge, two things at once:
 *   1. The prover knows (gpa, secret) that open the on-chain commitment
 *          commitment == Poseidon(gpa, secret)
 *      This binds the proof to a specific certificate whose
 *      `metadataCommitment` equals this Poseidon hash.
 *   2. gpa >= minGpa  (an ACTUAL enforced range constraint — the old
 *      circuit only assigned `diff` and never constrained it, so any GPA
 *      passed. That soundness hole is fixed here with GreaterEqThan).
 *
 * GPA values are integers scaled by 100 (e.g. 3.75 -> 375, max 500).
 *
 * Public signals (in snarkjs order: outputs first, then public inputs):
 *   [0] commitment  (output)  — must equal cert.metadataCommitment on-chain
 *   [1] minGpa      (input)   — the threshold that was proven
 *
 * Private signals:
 *   gpa, secret
 */
template Certify() {
    // Private inputs
    signal input gpa;      // scaled by 100, expected 0..500
    signal input secret;   // random field element (blinding factor)

    // Public input
    signal input minGpa;   // scaled by 100

    // Public output
    signal output commitment;

    // 1. Range-bound the private GPA so a malicious prover cannot feed a
    //    field-wrapped value that is huge but "looks" >= minGpa.
    //    16 bits covers 0..65535, comfortably above the 0..500 domain.
    component gpaBits = Num2Bits(16);
    gpaBits.in <== gpa;

    // 2. Enforce gpa >= minGpa (this is the real constraint).
    component ge = GreaterEqThan(16);
    ge.in[0] <== gpa;
    ge.in[1] <== minGpa;
    ge.out === 1;

    // 3. Commitment binds the proof to the certificate.
    //    Poseidon is a proper, collision-resistant hash inside the circuit,
    //    unlike the old `secret * metadataHash + actualGpa` which was
    //    trivially malleable and non-binding.
    component hasher = Poseidon(2);
    hasher.inputs[0] <== gpa;
    hasher.inputs[1] <== secret;
    commitment <== hasher.out;
}

component main {public [minGpa]} = Certify();
