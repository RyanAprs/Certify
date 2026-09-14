import { groth16 } from "snarkjs";
import { poseidon2 } from "poseidon-lite";
import { toHex } from "viem";

/**
 * Certificate metadata stored on IPFS.
 *
 * `secret` is the blinding factor chosen at issue time. Together with the
 * scaled GPA it opens the on-chain Poseidon commitment, so the holder needs it
 * to generate proofs later. (In production the metadata should be encrypted so
 * only the holder can read `secret`/`gpa`.)
 */
export interface CertificateMetadata {
  name: string;
  institution: string;
  program: string;
  gpa: string;
  description: string;
  imageCid: string;
  issuedAt: string;
  secret: string; // decimal string, field element < BN254 scalar order
}

export interface ZKProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  // [0] = commitment, [1] = minGpa
  publicSignals: string[];
}

// BN254 scalar field order.
const FIELD_ORDER =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Scale a GPA string to the circuit's integer domain (× 100, floored).
 * "3.75" -> 375, "4.0" -> 400. Valid range 0..500.
 */
export function gpaToCircuitInput(gpa: string): number {
  const value = parseFloat(gpa);
  if (isNaN(value) || value < 0 || value > 5) {
    throw new Error("Invalid GPA: must be a number between 0 and 5");
  }
  return Math.floor(value * 100);
}

/** Generate a cryptographically secure blinding secret as a field element. */
export function generateSecret(): string {
  const bytes = new Uint8Array(31); // 248 bits < field order, always in range
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const b of bytes) value = (value << 8n) | BigInt(b);
  return (value % FIELD_ORDER).toString();
}

/**
 * Poseidon(gpaScaled, secret) — the same hash the circuit computes. Returned as
 * a 32-byte hex string so it can be stored on-chain as `metadataCommitment`.
 */
export function computeCommitment(
  gpaScaled: number,
  secret: string
): `0x${string}` {
  const hash = poseidon2([BigInt(gpaScaled), BigInt(secret)]);
  return toHex(hash, { size: 32 });
}

/** Convenience: commitment straight from metadata. */
export function commitmentFromMetadata(
  metadata: Pick<CertificateMetadata, "gpa" | "secret">
): `0x${string}` {
  return computeCommitment(gpaToCircuitInput(metadata.gpa), metadata.secret);
}

/**
 * Generate a Groth16 proof that the holder's GPA ≥ minGpa, bound to the
 * certificate commitment, without revealing the GPA.
 */
export async function generateGpaProof(
  metadata: CertificateMetadata,
  minGpa: string
): Promise<ZKProof> {
  const gpaScaled = gpaToCircuitInput(metadata.gpa);
  const minScaled = gpaToCircuitInput(minGpa);
  if (!metadata.secret) {
    throw new Error("Certificate metadata is missing its secret blinding factor");
  }

  const input = {
    gpa: gpaScaled,
    secret: metadata.secret,
    minGpa: minScaled,
  };

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "/zk/certify.wasm",
    "/zk/certify.zkey"
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
 * Format a proof for the Solidity Groth16 verifier.
 *
 * IMPORTANT: snarkjs' G2 point (`pi_b`) coordinate pairs must be reversed for
 * the on-chain verifier. This matches `snarkjs.groth16.exportSolidityCallData`.
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
    wasm: await check("/zk/certify.wasm"),
    zkey: await check("/zk/certify.zkey"),
    vkey: await check("/zk/verification_key.json"),
  };
}
