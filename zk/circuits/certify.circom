template Certify() {
    // Private
    signal input secret;
    signal input metadataHash;

    // Public
    signal input minGpa;

    // Output publik
    signal output hash;

    // Constraint sederhana
    hash <== secret * metadataHash;
}

component main = Certify();
