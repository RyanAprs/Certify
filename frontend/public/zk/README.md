# ZK artifacts (generated — do not hand-edit)

These files are produced by the circuit build:

    cd zk && ./build.sh

which writes `certify.wasm`, `certify.zkey`, and `verification_key.json` here,
and regenerates `contracts/contracts/verifier.sol` (the `Groth16Verifier`).

Requires `circom` v2 — https://docs.circom.io/getting-started/installation/

Until they are built, proof generation is disabled and the Verifier page shows a
warning. Public signal layout: `[0] = commitment`, `[1] = minGpa`.
