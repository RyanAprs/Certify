#!/usr/bin/env bash
#
# Build the Certify predicate circuits end-to-end and publish artifacts to the
# frontend (proving) and the contracts package (on-chain verifiers).
#
# Circuits: range (value >= threshold, also expiry) and equality (claim == value).
#
# Requirements (install once):
#   - circom v2  ->  https://docs.circom.io/getting-started/installation/
#   - snarkjs    ->  invoked via npx
#
# Usage:
#   cd zk && npm install && ./build.sh

set -euo pipefail

cd "$(dirname "$0")"

# The Merkle inclusion path pushes constraints past 2^10; power-12 (4096) gives
# comfortable headroom for both circuits (~2.8k constraints each).
POT_POWER=12
BUILD_DIR="build"
PTAU="$BUILD_DIR/pot${POT_POWER}_final.ptau"
FRONTEND_ZK="../frontend/public/zk"
VERIFIERS_DIR="../contracts/contracts/verifiers"

command -v circom >/dev/null 2>&1 || { echo "❌ circom not found. Install circom v2 first."; exit 1; }
SNARKJS="npx --yes snarkjs"

mkdir -p "$BUILD_DIR" "$FRONTEND_ZK" "$VERIFIERS_DIR"

# No external download: generate a dev powers-of-tau locally (fast at power 12).
# Fine for local/testnet; use a real ceremony for mainnet.
if [ ! -f "$PTAU" ]; then
  echo "==> Generating powers-of-tau (bn128, power ${POT_POWER}, dev ceremony)…"
  $SNARKJS powersoftau new bn128 "$POT_POWER" "$BUILD_DIR/pot_0000.ptau" -v
  $SNARKJS powersoftau contribute "$BUILD_DIR/pot_0000.ptau" "$BUILD_DIR/pot_0001.ptau" \
    --name="certify-dev" -v -e="$(head -c 64 /dev/urandom | base64)"
  $SNARKJS powersoftau prepare phase2 "$BUILD_DIR/pot_0001.ptau" "$PTAU" -v
fi

# capitalize first letter → range -> Range
cap() { printf '%s' "$(tr '[:lower:]' '[:upper:]' <<< "${1:0:1}")${1:1}"; }

build_circuit() {
  local c="$1"
  local Name; Name="$(cap "$c")"
  echo ""
  echo "════════ Building '$c' ════════"

  circom "circuits/${c}.circom" --r1cs --wasm --sym -l node_modules -o "$BUILD_DIR"
  $SNARKJS r1cs info "$BUILD_DIR/${c}.r1cs"

  $SNARKJS groth16 setup "$BUILD_DIR/${c}.r1cs" "$PTAU" "$BUILD_DIR/${c}_0000.zkey"
  $SNARKJS zkey contribute "$BUILD_DIR/${c}_0000.zkey" "$BUILD_DIR/${c}_final.zkey" \
    --name="certify-dev" -v -e="$(head -c 64 /dev/urandom | base64)"

  # Verification key (per circuit)
  $SNARKJS zkey export verificationkey "$BUILD_DIR/${c}_final.zkey" "$FRONTEND_ZK/${c}.vkey.json"

  # Solidity verifier — snarkjs names it Groth16Verifier; rename per circuit.
  $SNARKJS zkey export solidityverifier "$BUILD_DIR/${c}_final.zkey" "$BUILD_DIR/${c}_verifier.sol"
  sed "s/contract Groth16Verifier/contract ${Name}Verifier/" \
    "$BUILD_DIR/${c}_verifier.sol" > "$VERIFIERS_DIR/${Name}Verifier.sol"

  # Proving artifacts for the browser
  cp "$BUILD_DIR/${c}_js/${c}.wasm" "$FRONTEND_ZK/${c}.wasm"
  cp "$BUILD_DIR/${c}_final.zkey"   "$FRONTEND_ZK/${c}.zkey"

  echo "→ ${Name}Verifier.sol + ${c}.wasm/zkey/vkey published"
}

for circuit in range equality membership; do
  build_circuit "$circuit"
done

echo ""
echo "✅ Done."
echo "   contracts/contracts/verifiers/RangeVerifier.sol, EqualityVerifier.sol"
echo "   frontend/public/zk/{range,equality}.{wasm,zkey,vkey.json}"
echo ""
echo "Public signals — range: [root,keyHash,threshold] · equality: [root,keyHash,value]"
