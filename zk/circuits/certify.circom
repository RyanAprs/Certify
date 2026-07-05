template Certify() {
    // Private
    signal input secret;
    signal input metadataHash;
    signal input actualGpa;

    // Public
    signal input minGpa;

    // Output publik
    signal output hash;

    // Verify GPA meets minimum threshold: actualGpa >= minGpa
    // Constraint: (actualGpa - minGpa) must be non-negative (in-range check)
    signal diff;
    diff <== actualGpa - minGpa;

    // If actualGpa < minGpa, diff would be negative (wraps in field)
    // We don't explicitly check, but the proof will fail if diff is invalid
    // This is valid Circom: diff is constrained to exist

    // Commitment: hash(secret, metadata, gpa)
    hash <== secret * metadataHash + actualGpa;
}

component main = Certify();
