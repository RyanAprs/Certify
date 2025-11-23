import { groth16 } from "snarkjs";
import { keccak256, toBytes } from "viem";

export interface CertificateMetadata {
  name: string;
  institution: string;
  program: string;
  gpa: string;
  description: string;
  imageCid: string;
  issuedAt: string;
}

export interface ProofInputs {
  metadataHash: string;
  minGpa: string;
  actualGpa: string;
}

export interface ZKProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
}

/**
 * Generate metadata commitment (hash)
 */
export function generateMetadataCommitment(
  metadata: CertificateMetadata
): `0x${string}` {
  return keccak256(toBytes(JSON.stringify(metadata)));
}

/**
 * Convert GPA string to circuit input (multiply by 100)
 * Example: "3.75" => "375"
 */
export function gpaToCircuitInput(gpa: string): string {
  const gpaFloat = parseFloat(gpa);
  if (isNaN(gpaFloat)) throw new Error("Invalid GPA format");
  return Math.round(gpaFloat * 100).toString();
}

/**
 * Convert metadata hash to circuit input (remove 0x prefix and convert to decimal)
 */
export function hashToCircuitInput(hash: `0x${string}`): string {
  // Remove 0x prefix and convert hex to decimal string
  const hexValue = hash.slice(2);
  return BigInt("0x" + hexValue).toString();
}

/**
 * Generate ZK proof for GPA verification
 * Uses files from public/zk/ directory
 */
export async function generateGpaProof(
  metadata: CertificateMetadata,
  minGpa: string
): Promise<ZKProof> {
  try {
    const metadataHash = generateMetadataCommitment(metadata);
    const actualGpa = gpaToCircuitInput(metadata.gpa);
    const minGpaCircuit = gpaToCircuitInput(minGpa);
    const metadataHashCircuit = hashToCircuitInput(metadataHash);

    // Prepare circuit inputs
    const input: ProofInputs = {
      metadataHash: metadataHashCircuit,
      minGpa: minGpaCircuit,
      actualGpa: actualGpa,
    };

    console.log("Generating proof with inputs:", {
      metadataHash: metadataHash,
      metadataHashCircuit: metadataHashCircuit,
      minGpa: minGpa,
      minGpaCircuit: minGpaCircuit,
      actualGpa: metadata.gpa,
      actualGpaCircuit: actualGpa,
    });

    // Generate proof using files from public/zk/
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      "/zk/certify.wasm",
      "/zk/certify.zkey"
    );

    console.log("Proof generated successfully");
    console.log("Public signals:", publicSignals);

    return {
      proof: {
        pi_a: proof.pi_a.slice(0, 2).map((x: any) => x.toString()),
        pi_b: proof.pi_b.map((row: any[]) =>
          row.slice(0, 2).map((x: any) => x.toString())
        ),
        pi_c: proof.pi_c.slice(0, 2).map((x: any) => x.toString()),
      },
      publicSignals: publicSignals.map((x: any) => x.toString()),
    };
  } catch (error: any) {
    console.error("ZK proof generation failed:", error);
    throw new Error(
      `Failed to generate zero-knowledge proof: ${error.message}`
    );
  }
}

/**
 * Verify ZK proof locally using verification key
 */
export async function verifyProof(zkProof: ZKProof): Promise<boolean> {
  try {
    console.log("Fetching verification key...");
    const vKeyResponse = await fetch("/zk/verification_key.json");

    if (!vKeyResponse.ok) {
      throw new Error("Failed to fetch verification key");
    }

    const vKey = await vKeyResponse.json();
    console.log("Verification key loaded");

    console.log("Verifying proof...");
    const verified = await groth16.verify(
      vKey,
      zkProof.publicSignals,
      zkProof.proof
    );

    console.log("Verification result:", verified);
    return verified;
  } catch (error: any) {
    console.error("ZK proof verification failed:", error);
    throw new Error(`Failed to verify proof: ${error.message}`);
  }
}

/**
 * Format proof for Solidity verifier contract
 */
export function formatProofForSolidity(zkProof: ZKProof) {
  return {
    pA: zkProof.proof.pi_a,
    pB: zkProof.proof.pi_b,
    pC: zkProof.proof.pi_c,
    pubSignals: zkProof.publicSignals,
  };
}

/**
 * Validate that ZK files exist
 */
export async function validateZkFiles(): Promise<{
  wasm: boolean;
  zkey: boolean;
  vkey: boolean;
}> {
  const results = {
    wasm: false,
    zkey: false,
    vkey: false,
  };

  try {
    const wasmResponse = await fetch("/zk/certify.wasm", { method: "HEAD" });
    results.wasm = wasmResponse.ok;
  } catch (e) {
    console.error("WASM file not found");
  }

  try {
    const zkeyResponse = await fetch("/zk/certify.zkey", { method: "HEAD" });
    results.zkey = zkeyResponse.ok;
  } catch (e) {
    console.error("ZKEY file not found");
  }

  try {
    const vkeyResponse = await fetch("/zk/verification_key.json", {
      method: "HEAD",
    });
    results.vkey = vkeyResponse.ok;
  } catch (e) {
    console.error("Verification key file not found");
  }

  return results;
}
