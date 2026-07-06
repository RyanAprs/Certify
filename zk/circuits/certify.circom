template Certify() {
    // Private
    signal input secret;
    signal input metadataHash;

    // Public
    signal input minGpa;

    // Output publik
    signal output hash;

    // Commitment: hash(secret, metadata, minGpa)
    hash <== secret * metadataHash + minGpa;
}

component main = Certify();
