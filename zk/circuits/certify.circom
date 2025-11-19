template Certify() {
    // Input signals (private)
    signal input secret;
    signal input data;
    
    // Output signal (public)
    signal output hash;
    
    // Constraint
    hash <== secret * data;
}

component main = Certify();