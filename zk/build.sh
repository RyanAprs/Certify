#!/usr/bin/env bash
#
# Build the Certify range circuit end-to-end and publish artifacts to the
# frontend (proving) and the contracts package (on-chain verifier).
#
# Requirements (install once):
#   - circom v2  ->  https://docs.circom.io/getting-started/installation/
#   - snarkjs    ->  invoked via npx
#
# Usage:
#   cd zk && npm install && ./build.sh
#
# It is deterministic apart from the dev trusted-setup contribution entropy,
# which is fine for local/testnet. DO NOT use these keys for mainnet — run a
# real multi-party ceremony instead.

set -euo pipefail

cd "$(dirname "$0")"

CIRCUIT=range
CIRCUIT_SRC="circuits/${CIRCUIT}.circom"
# The Merkle inclusion path pushes the constraint count well past 2^10, so a
# larger powers-of-tau is required. Power 14 (16k constraints) is comfortable.
PTAU="circuits/powersOfTau28_hez_final_14.ptau"
BUILD_DIR="build"
FRONTEND_ZK="../frontend/public/zk"
CONTRACTS_DIR="../contracts/contracts"

command -v circom >/dev/null 2>&1 || { echo "❌ circom not found. Install circom v2 first."; exit 1; }
SNARKJS="npx --yes snarkjs"

if [ ! -f "$PTAU" ]; then
  echo "❌ Missing $PTAU"
  echo "   Download a Hermez powers-of-tau of power >= 14, e.g.:"
  echo "   curl -L -o $PTAU https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau"
  exit 1
fi

echo "==> 1/6 Compiling circuit ($CIRCUIT)"
mkdir -p "$BUILD_DIR"
circom "$CIRCUIT_SRC" --r1cs --wasm --sym -l node_modules -o "$BUILD_DIR"
$SNARKJS r1cs info "$BUILD_DIR/${CIRCUIT}.r1cs"

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
cp "$BUILD_DIR/${CIRCUIT}_final.zkey"         "$FRONTEND_ZK/${CIRCUIT}.zkey"
cp "$BUILD_DIR/verification_key.json"         "$FRONTEND_ZK/verification_key.json"

echo ""
echo "✅ Done."
echo "   frontend/public/zk/range.wasm"
echo "   frontend/public/zk/range.zkey"
echo "   frontend/public/zk/verification_key.json"
echo "   contracts/contracts/verifier.sol   (Groth16Verifier — deploy this)"
echo ""
echo "Public signal layout: [0]=root, [1]=keyHash, [2]=threshold"
