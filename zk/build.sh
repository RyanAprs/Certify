#!/usr/bin/env bash
#
# Build the Certify ZK circuit end-to-end and publish artifacts to the
# frontend (proving) and the contracts package (on-chain verifier).
#
# Requirements (install once):
#   - circom v2  ->  https://docs.circom.io/getting-started/installation/
#   - snarkjs    ->  npm i -g snarkjs   (or use npx)
#
# Usage:
#   cd zk && ./build.sh
#
# It is deterministic apart from the dev trusted-setup contribution entropy,
# which is fine for local/testnet. DO NOT use these keys for mainnet — run a
# real multi-party ceremony instead.

set -euo pipefail

cd "$(dirname "$0")"

CIRCUIT=certify
CIRCUIT_SRC="circuits/${CIRCUIT}.circom"
PTAU="circuits/powersOfTau28_hez_final_10.ptau"
BUILD_DIR="build"
FRONTEND_ZK="../frontend/public/zk"
CONTRACTS_DIR="../contracts/contracts"

command -v circom >/dev/null 2>&1 || { echo "❌ circom not found. Install circom v2 first."; exit 1; }
SNARKJS="npx --yes snarkjs"

[ -f "$PTAU" ] || { echo "❌ Missing $PTAU (powers of tau). Download a Hermez ptau of power >= 12."; exit 1; }

echo "==> 1/6 Compiling circuit"
mkdir -p "$BUILD_DIR"
circom "$CIRCUIT_SRC" --r1cs --wasm --sym -l node_modules -o "$BUILD_DIR"

echo "==> 2/6 Groth16 setup"
$SNARKJS groth16 setup "$BUILD_DIR/${CIRCUIT}.r1cs" "$PTAU" "$BUILD_DIR/${CIRCUIT}_0000.zkey"

echo "==> 3/6 Contributing to phase 2 (dev entropy)"
$SNARKJS zkey contribute "$BUILD_DIR/${CIRCUIT}_0000.zkey" "$BUILD_DIR/${CIRCUIT}_final.zkey" \
  --name="certify-dev" -v -e="$(head -c 64 /dev/urandom | base64)"

echo "==> 4/6 Exporting verification key"
$SNARKJS zkey export verificationkey "$BUILD_DIR/${CIRCUIT}_final.zkey" "$BUILD_DIR/verification_key.json"

echo "==> 5/6 Exporting Solidity verifier"
$SNARKJS zkey export solidityverifier "$BUILD_DIR/${CIRCUIT}_final.zkey" "$BUILD_DIR/verifier.sol"
# snarkjs names the contract `Groth16Verifier`; keep that name, just relocate it.
cp "$BUILD_DIR/verifier.sol" "$CONTRACTS_DIR/verifier.sol"

echo "==> 6/6 Publishing proving artifacts to frontend"
mkdir -p "$FRONTEND_ZK"
cp "$BUILD_DIR/${CIRCUIT}_js/${CIRCUIT}.wasm" "$FRONTEND_ZK/${CIRCUIT}.wasm"
cp "$BUILD_DIR/${CIRCUIT}_final.zkey"        "$FRONTEND_ZK/${CIRCUIT}.zkey"
cp "$BUILD_DIR/verification_key.json"        "$FRONTEND_ZK/verification_key.json"

echo ""
echo "✅ Done."
echo "   frontend/public/zk/certify.wasm"
echo "   frontend/public/zk/certify.zkey"
echo "   frontend/public/zk/verification_key.json"
echo "   contracts/contracts/verifier.sol   (Groth16Verifier — deploy this)"
echo ""
echo "Public signal layout: [0]=commitment, [1]=minGpa"
