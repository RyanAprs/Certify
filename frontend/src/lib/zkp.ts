import { groth16 } from "snarkjs";
import { buildClaimTree, keyHash, merklePath, randomSalt, ClaimInput } from "./merkle";
import { Schema, ClaimField, encodeClaimValue, Predicate } from "./schemas";

/**
 * Credential metadata stored on IPFS.
 *
 * `claims` are the raw human values (numbers, unix timestamps, or strings);
 * `salts` blind each claim leaf. Together with the schema they reproduce the
 * Merkle root stored on-chain. (In production this should be encrypted so only
 * the holder can read claim values.)
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
  claims: Record<string, number | string>;
  salts: Record<string, string>;
}

export interface ZKProof {
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] };
  // range: [root, keyHash, threshold] · equality: [root, keyHash, value]
  publicSignals: string[];
}

function fieldFor(schema: Schema, key: string): ClaimField {
  const f = schema.claims.find((c) => c.key === key);
  if (!f) throw new Error(`Unknown claim "${key}" for ${schema.label}`);
  return f;
}

/** Scaled claim inputs (key → integer) in the schema's leaf order. */
function claimInputs(schema: Schema, meta: CredentialMetadata): ClaimInput[] {
  return schema.claims.map((f) => ({
    key: f.key,
    value: encodeClaimValue(f, meta.claims[f.key]),
    salt: BigInt(meta.salts[f.key]),
  }));
}

/**
 * Issue-time: build the credential's Merkle commitment. Generates a salt per
 * claim and returns the root plus the salts to persist in the metadata.
 */
export function buildCommitment(
  schema: Schema,
  rawClaims: Record<string, number | string>
): { rootHex: `0x${string}`; salts: Record<string, string> } {
  const salts: Record<string, string> = {};
  const claims: ClaimInput[] = schema.claims.map((f) => {
    const salt = randomSalt();
    salts[f.key] = salt.toString();
    return { key: f.key, value: encodeClaimValue(f, rawClaims[f.key]), salt };
  });
  const { rootHex } = buildClaimTree(claims);
  return { rootHex, salts };
}

function pathFor(schema: Schema, meta: CredentialMetadata, claimKey: string) {
  if (meta.salts?.[claimKey] === undefined) {
    throw new Error("Credential metadata is missing claim salts (re-issue required)");
  }
  const tree = buildClaimTree(claimInputs(schema, meta));
  return { salt: meta.salts[claimKey], ...merklePath(tree.layers, tree.index[claimKey]) };
}

async function prove(
  circuit: Predicate,
  input: Record<string, unknown>
): Promise<ZKProof> {
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    `/zk/${circuit}.wasm`,
    `/zk/${circuit}.zkey`
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

/** Prove claim value ≥ threshold (numbers, or expiry via a timestamp claim). */
export async function generateRangeProof(
  schema: Schema,
  meta: CredentialMetadata,
  claimKey: string,
  thresholdRaw: number
): Promise<ZKProof> {
  const field = fieldFor(schema, claimKey);
  const { salt, pathElements, pathIndices } = pathFor(schema, meta, claimKey);
  return prove("range", {
    value: encodeClaimValue(field, meta.claims[claimKey]).toString(),
    salt,
    keyHash: keyHash(claimKey).toString(),
    threshold: encodeClaimValue(field, thresholdRaw).toString(),
    pathElements: pathElements.map((x) => x.toString()),
    pathIndices,
  });
}

/** Prove claim value == the given value (numbers or strings). */
export async function generateEqualityProof(
  schema: Schema,
  meta: CredentialMetadata,
  claimKey: string,
  valueRaw: number | string
): Promise<ZKProof> {
  const field = fieldFor(schema, claimKey);
  const { salt, pathElements, pathIndices } = pathFor(schema, meta, claimKey);
  return prove("equality", {
    value: encodeClaimValue(field, valueRaw).toString(),
    salt,
    keyHash: keyHash(claimKey).toString(),
    pathElements: pathElements.map((x) => x.toString()),
    pathIndices,
  });
}

/** Verify a proof locally against the predicate's verification key. */
export async function verifyProof(zkProof: ZKProof, predicate: Predicate): Promise<boolean> {
  const vKey = await (await fetch(`/zk/${predicate}.vkey.json`)).json();
  return groth16.verify(vKey, zkProof.publicSignals, zkProof.proof);
}

/**
 * Format a proof for the Solidity Groth16 verifier (3 public signals).
 * snarkjs' G2 point (`pi_b`) coordinate pairs are reversed for the on-chain
 * verifier — matches `snarkjs.groth16.exportSolidityCallData`.
 */
export function formatProofForSolidity(zkProof: ZKProof) {
  const { pi_a, pi_b, pi_c } = zkProof.proof;
  const a: [bigint, bigint] = [BigInt(pi_a[0]), BigInt(pi_a[1])];
  const b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(pi_b[0][1]), BigInt(pi_b[0][0])],
    [BigInt(pi_b[1][1]), BigInt(pi_b[1][0])],
  ];
  const c: [bigint, bigint] = [BigInt(pi_c[0]), BigInt(pi_c[1])];
  const pubSignals = zkProof.publicSignals.map((x) => BigInt(x)) as [bigint, bigint, bigint];
  return { a, b, c, pubSignals };
}

/** Check that the ZK artifacts for both predicates have been built. */
export async function validateZkFiles(): Promise<{ wasm: boolean; zkey: boolean; vkey: boolean }> {
  const check = async (path: string) => {
    try {
      return (await fetch(path, { method: "HEAD" })).ok;
    } catch {
      return false;
    }
  };
  const [rw, rz, rv, ew, ez, ev] = await Promise.all([
    check("/zk/range.wasm"),
    check("/zk/range.zkey"),
    check("/zk/range.vkey.json"),
    check("/zk/equality.wasm"),
    check("/zk/equality.zkey"),
    check("/zk/equality.vkey.json"),
  ]);
  return { wasm: rw && ew, zkey: rz && ez, vkey: rv && ev };
}
