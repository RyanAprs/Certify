import { groth16 } from "snarkjs";
import {
  MERKLE_DEPTH,
  buildClaimTree,
  keyHash,
  merklePath,
  randomSalt,
  ClaimInput,
} from "./merkle";
import { Schema, ClaimField, scaleClaim } from "./schemas";

/**
 * Credential metadata stored on IPFS.
 *
 * `claims` are the raw human values; `salts` blind each claim leaf. Together
 * with the schema they reproduce the Merkle root stored on-chain, so the holder
 * can generate range proofs later. (In production this should be encrypted so
 * only the holder can read claim values.)
 */
export interface CredentialMetadata {
  schemaId: `0x${string}`;
  type: string;
  name: string;
  institution: string;
  program: string;
  description: string;
  imageCid: string;
  issuedAt: string;
  claims: Record<string, number>;
  salts: Record<string, string>;
}

export interface ZKProof {
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] };
  // [0] = root, [1] = keyHash, [2] = threshold
  publicSignals: string[];
}

/** Scaled claim inputs (key → integer) in the schema's leaf order. */
function claimInputs(schema: Schema, meta: CredentialMetadata): ClaimInput[] {
  return schema.claims.map((f) => ({
    key: f.key,
    value: BigInt(scaleClaim(f, meta.claims[f.key])),
    salt: BigInt(meta.salts[f.key]),
  }));
}

/**
 * Issue-time: build the credential's Merkle commitment. Generates a salt per
 * claim and returns the root plus the salts to persist in the metadata.
 */
export function buildCommitment(
  schema: Schema,
  rawClaims: Record<string, number>
): { rootHex: `0x${string}`; salts: Record<string, string> } {
  const salts: Record<string, string> = {};
  const claims: ClaimInput[] = schema.claims.map((f) => {
    const salt = randomSalt();
    salts[f.key] = salt.toString();
    return { key: f.key, value: BigInt(scaleClaim(f, rawClaims[f.key])), salt };
  });
  const { rootHex } = buildClaimTree(claims);
  return { rootHex, salts };
}

/**
 * Prove that a single claim's value ≥ threshold, bound to the credential's
 * Merkle root, without revealing the value.
 */
export async function generateRangeProof(
  schema: Schema,
  meta: CredentialMetadata,
  claimKey: string,
  thresholdRaw: number
): Promise<ZKProof> {
  const field = schema.claims.find((f) => f.key === claimKey);
  if (!field) throw new Error(`Unknown claim "${claimKey}" for ${schema.label}`);
  if (meta.salts?.[claimKey] === undefined) {
    throw new Error("Credential metadata is missing claim salts (re-issue required)");
  }

  const tree = buildClaimTree(claimInputs(schema, meta));
  const leafIndex = tree.index[claimKey];
  const path = merklePath(tree.layers, leafIndex);

  const input = {
    value: scaleClaim(field, meta.claims[claimKey]),
    salt: meta.salts[claimKey],
    keyHash: keyHash(claimKey).toString(),
    threshold: scaleClaim(field, thresholdRaw),
    pathElements: path.pathElements.map((x) => x.toString()),
    pathIndices: path.pathIndices,
  };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "/zk/range.wasm",
    "/zk/range.zkey"
  );

  return {
    proof: {
      pi_a: proof.pi_a.map((x: any) => x.toString()),
      pi_b: proof.pi_b.map((row: any[]) => row.map((x: any) => x.toString())),
      pi_c: proof.pi_c.map((x: any) => x.toString()),
    },
    publicSignals: publicSignals.map((x: any) => x.toString()),
  };
}

/** Verify a proof locally against the verification key. */
export async function verifyProof(zkProof: ZKProof): Promise<boolean> {
  const vKey = await (await fetch("/zk/verification_key.json")).json();
  return groth16.verify(vKey, zkProof.publicSignals, zkProof.proof);
}

/**
 * Format a proof for the Solidity Groth16 verifier (range, 3 public signals).
 * snarkjs' G2 point (`pi_b`) coordinate pairs are reversed for the on-chain
 * verifier — this matches `snarkjs.groth16.exportSolidityCallData`.
 */
export function formatProofForSolidity(zkProof: ZKProof) {
  const { pi_a, pi_b, pi_c } = zkProof.proof;
  const a: [bigint, bigint] = [BigInt(pi_a[0]), BigInt(pi_a[1])];
  const b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(pi_b[0][1]), BigInt(pi_b[0][0])],
    [BigInt(pi_b[1][1]), BigInt(pi_b[1][0])],
  ];
  const c: [bigint, bigint] = [BigInt(pi_c[0]), BigInt(pi_c[1])];
  const pubSignals = zkProof.publicSignals.map((x) => BigInt(x)) as [
    bigint,
    bigint,
    bigint
  ];
  return { a, b, c, pubSignals };
}

/** Check that the ZK artifacts have been built and published. */
export async function validateZkFiles(): Promise<{
  wasm: boolean;
  zkey: boolean;
  vkey: boolean;
}> {
  const check = async (path: string) => {
    try {
      return (await fetch(path, { method: "HEAD" })).ok;
    } catch {
      return false;
    }
  };
  return {
    wasm: await check("/zk/range.wasm"),
    zkey: await check("/zk/range.zkey"),
    vkey: await check("/zk/verification_key.json"),
  };
}

export { MERKLE_DEPTH };
