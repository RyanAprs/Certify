import { poseidon1, poseidon2, poseidon3 } from "poseidon-lite";
import { toHex } from "viem";

/**
 * Claim-based Merkle commitment. Shared, canonical logic that MUST stay
 * byte-for-byte consistent with the circom circuit (`range.circom`):
 *   - keyHash   = Poseidon(encodeKey(key))
 *   - leaf      = Poseidon(keyHash, value, salt)
 *   - node      = Poseidon(left, right)
 *   - root      = fold over a fixed-depth tree, zero-padded
 *
 * A credential is a set of numeric claims; its `metadataCommitment` is the
 * Merkle root. Selective disclosure proves a statement about one leaf via its
 * Merkle path, without revealing the value.
 */

export const MERKLE_DEPTH = 4; // up to 2^4 = 16 claims per credential
export const N_LEAVES = 1 << MERKLE_DEPTH;

const FIELD_ORDER =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** Pack a short string (utf-8, ≤31 bytes) into a field element. */
export function packString(s: string): bigint {
  const bytes = new TextEncoder().encode(s);
  if (bytes.length > 31) throw new Error(`String too long to pack: "${s}"`);
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return v % FIELD_ORDER;
}

/** Stable field-element identifier for a claim key. */
export function keyHash(key: string): bigint {
  return poseidon1([packString(key)]);
}

export function leafHash(kHash: bigint, value: bigint, salt: bigint): bigint {
  return poseidon3([kHash, value, salt]);
}

/** Random field-element blinding salt (248-bit, always in range). */
export function randomSalt(): bigint {
  const bytes = new Uint8Array(31);
  crypto.getRandomValues(bytes);
  let v = 0n;
  for (const b of bytes) v = (v << 8n) | BigInt(b);
  return v % FIELD_ORDER;
}

/** Build all tree layers from exactly N_LEAVES leaves (bottom → top). */
function buildLayers(leaves: bigint[]): bigint[][] {
  if (leaves.length !== N_LEAVES) {
    throw new Error(`Expected ${N_LEAVES} leaves, got ${leaves.length}`);
  }
  const layers: bigint[][] = [leaves];
  let cur = leaves;
  while (cur.length > 1) {
    const next: bigint[] = [];
    for (let i = 0; i < cur.length; i += 2) {
      next.push(poseidon2([cur[i], cur[i + 1]]));
    }
    layers.push(next);
    cur = next;
  }
  return layers;
}

export interface ClaimInput {
  key: string;
  value: bigint; // already scaled to an integer
  salt: bigint;
}

export interface BuiltTree {
  root: bigint;
  rootHex: `0x${string}`;
  leaves: bigint[];
  /** leaf index per claim key (schema/insertion order) */
  index: Record<string, number>;
  layers: bigint[][];
}

/**
 * Build the credential tree. Claims occupy leaves in the given order; the rest
 * are zero-padded. Returns the root plus everything needed to make a proof.
 */
export function buildClaimTree(claims: ClaimInput[]): BuiltTree {
  if (claims.length > N_LEAVES) throw new Error("too many claims");
  const leaves = new Array<bigint>(N_LEAVES).fill(0n);
  const index: Record<string, number> = {};
  claims.forEach((c, i) => {
    index[c.key] = i;
    leaves[i] = leafHash(keyHash(c.key), c.value, c.salt);
  });
  const layers = buildLayers(leaves);
  const root = layers[layers.length - 1][0];
  return { root, rootHex: toHex(root, { size: 32 }), leaves, index, layers };
}

export interface MerklePath {
  pathElements: bigint[]; // sibling per level
  pathIndices: number[]; // 0 = current is left, 1 = current is right
}

/** Sibling path for the leaf at `leafIndex`. */
export function merklePath(layers: bigint[][], leafIndex: number): MerklePath {
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  let idx = leafIndex;
  for (let level = 0; level < MERKLE_DEPTH; level++) {
    const isRight = idx & 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    pathElements.push(layers[level][siblingIdx]);
    pathIndices.push(isRight);
    idx >>= 1;
  }
  return { pathElements, pathIndices };
}
