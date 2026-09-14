# ZK artifacts (generated — do not hand-edit)

Produced by the circuit build (builds BOTH predicate circuits):

    cd zk && npm install && ./build.sh

Writes here:
- `range.wasm` / `range.zkey` / `range.vkey.json`         (value ≥ threshold, and expiry)
- `equality.wasm` / `equality.zkey` / `equality.vkey.json` (claim == value)

and regenerates `contracts/contracts/verifiers/{RangeVerifier,EqualityVerifier}.sol`.

Requires `circom` v2 (https://docs.circom.io/getting-started/installation/) and a
powers-of-tau of power ≥ 14. `build.sh` prints the download command if missing.

Until built, proof generation is disabled and the Verifier page shows a warning.
Public signals — range: `[root, keyHash, threshold]` · equality: `[root, keyHash, value]`.
