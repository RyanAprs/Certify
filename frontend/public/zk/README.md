# ZK artifacts (generated — do not hand-edit)

These files are produced by the circuit build:

    cd zk && npm install && ./build.sh

which writes `range.wasm`, `range.zkey`, and `verification_key.json` here, and
regenerates `contracts/contracts/verifier.sol` (the `Groth16Verifier`).

Requires `circom` v2 (https://docs.circom.io/getting-started/installation/) and
a powers-of-tau of power ≥ 14 (the Merkle path makes the circuit larger than the
old GPA circuit). `build.sh` prints the download command if it's missing.

Until they are built, proof generation is disabled and the Verifier page shows a
warning. Public signal layout: `[0] = root`, `[1] = keyHash`, `[2] = threshold`.
