import { groth16 } from "snarkjs";
import { keccak256, toBytes, encodeAbiParameters } from "viem";

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
  secret: string;
  metadataHash: string;
  minGpa: string;
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
 * Convert hash to circuit input (remove 0x prefix and convert to decimal)
 */
export function hashToCircuitInput(hash: `0x${string}`): string {
  const hexValue = hash.slice(2);
  return BigInt("0x" + hexValue).toString();
}

/**
 * Generate a random secret for the proof
 */
export function generateSecret(): string {
  // Generate a random number as secret
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const secret = BigInt(
    "0x" +
      Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
  );
  // Keep it reasonable size for circuit
  return (secret % BigInt(1000000000)).toString();
}

/**
 * Generate ZK proof for certificate verification
 * Uses files from public/zk/ directory
 */
export async function generateGpaProof(
  metadata: CertificateMetadata,
  minGpa: string
): Promise<ZKProof> {
  try {
    const metadataHash = generateMetadataCommitment(metadata);
    const metadataHashCircuit = hashToCircuitInput(metadataHash);
    const minGpaCircuit = gpaToCircuitInput(minGpa);
    const secret = generateSecret();

    // Prepare circuit inputs matching your Certify circuit
    const input: ProofInputs = {
      secret: secret,
      metadataHash: metadataHashCircuit,
      minGpa: minGpaCircuit,
    };

    console.log("Generating proof with inputs:", {
      secret: secret,
      metadataHash: metadataHash,
      metadataHashCircuit: metadataHashCircuit.slice(0, 20) + "...",
      minGpa: `${minGpa} => ${minGpaCircuit}`,
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
        pi_b: proof.pi_b
          .slice(0, 2)
          .map((row: any[]) => row.slice(0, 2).map((x: any) => x.toString())),
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
 * This matches the standard Groth16 verifier format
 */
export function formatProofForSolidity(zkProof: ZKProof) {
  const pA = zkProof.proof.pi_a.slice(0, 2); // [2]
  const pB = zkProof.proof.pi_b.slice(0, 2).map((row) => row.slice(0, 2)); // [2][2]
  const pC = zkProof.proof.pi_c.slice(0, 2); // [2]
  const pubSignals = zkProof.publicSignals;

  return {
    pA,
    pB,
    pC,
    pubSignals,
  };
}

/**
 * Encode proof as bytes for contract call
 * Format depends on your ZKVerifier contract implementation
 *
 * Option 1: Standard Groth16 format (a, b, c, input)
 * Option 2: Packed format with all components
 */
export function encodeProofForContract(
  zkProof: ZKProof,
  format: "standard" | "packed" = "standard"
): `0x${string}` {
  const { pA, pB, pC, pubSignals } = formatProofForSolidity(zkProof);

  if (format === "standard") {
    // Standard encoding: (uint[2] a, uint[2][2] b, uint[2] c, uint[] input)
    return encodeAbiParameters(
      [
        { type: "uint256[2]", name: "a" },
        { type: "uint256[2][2]", name: "b" },
        { type: "uint256[2]", name: "c" },
        { type: "uint256[]", name: "input" },
      ],
      [pA, pB, pC, pubSignals]
    ) as `0x${string}`;
  } else {
    // Packed encoding: all values concatenated
    // Format: a[0], a[1], b[0][0], b[0][1], b[1][0], b[1][1], c[0], c[1], input[0], input[1], ...
    const allValues = [...pA, ...pB[0], ...pB[1], ...pC, ...pubSignals];

    return encodeAbiParameters(
      [{ type: "uint256[]" }],
      [allValues]
    ) as `0x${string}`;
  }
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
