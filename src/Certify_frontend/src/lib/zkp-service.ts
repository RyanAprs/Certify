import * as snarkjs from "snarkjs";
import { sha256 } from "js-sha256";
import { MerkleTree } from "merkletreejs";

export interface CertificateData {
  title: string;
  description: string;
  issuer: string;
  holder: string;
  metadata: any;
  timestamp: number;
}

export interface ZKProofData {
  proof: any;
  publicSignals: string[];
  proofHash: string;
}

export interface VerificationKey {
  protocol: string;
  curve: string;
  nPublic: number;
  vk_alpha_1: string[];
  vk_beta_2: string[][];
  vk_gamma_2: string[][];
  vk_delta_2: string[][];
  vk_alphabeta_12: string[][];
  IC: string[][];
}

class ZKPService {
  private wasmPath: string;
  private zkeyPath: string;
  private verificationKey: VerificationKey | null = null;

  constructor() {
    this.wasmPath = "/zkp/certificate.wasm";
    this.zkeyPath = "/zkp/certificate_final.zkey";
  }

  /**
   * Initialize ZKP service by loading verification key
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch("/zkp/verification_key.json");
      this.verificationKey = await response.json();
    } catch (error) {
      console.error("Failed to load verification key:", error);
      throw new Error("ZKP initialization failed");
    }
  }

  /**
   * Generate hash for certificate data
   */
  private generateCertificateHash(data: CertificateData): string {
    const dataString = JSON.stringify({
      title: data.title,
      description: data.description,
      issuer: data.issuer,
      holder: data.holder,
      metadata: data.metadata,
      timestamp: data.timestamp,
    });
    return sha256(dataString);
  }

  /**
   * Convert string to field element for circom
   */
  private stringToFieldElement(str: string): string {
    const hash = sha256(str);
    // Convert hex to bigint and ensure it's within field size
    const bigIntValue = BigInt("0x" + hash);
    const fieldSize = BigInt(
      "21888242871839275222246405745257275088548364400416034343698204186575808495617"
    );
    return (bigIntValue % fieldSize).toString();
  }

  /**
   * Generate Merkle tree for selective disclosure
   */
  private generateMerkleTree(data: CertificateData): {
    tree: MerkleTree;
    leaves: string[];
  } {
    const leaves = [
      sha256(data.title),
      sha256(data.description),
      sha256(data.issuer),
      sha256(data.holder),
      sha256(JSON.stringify(data.metadata)),
      sha256(data.timestamp.toString()),
    ];

    const tree = new MerkleTree(leaves, sha256, { sortPairs: true });
    return { tree, leaves };
  }

  /**
   * Generate ZK proof for certificate
   */
  async generateProof(
    certificateData: CertificateData,
    issuerPrivateKey: string,
    salt = "default_salt"
  ): Promise<ZKProofData> {
    try {
      const certificateHash = this.generateCertificateHash(certificateData);

      // Generate issuer public key from private key
      const issuerPublicKey = sha256(issuerPrivateKey + salt);

      // Prepare circuit inputs
      const input = {
        // Public inputs
        certificateHash: this.stringToFieldElement(certificateHash),
        issuerPublicKey: this.stringToFieldElement(issuerPublicKey),
        holderPublicKey: this.stringToFieldElement(certificateData.holder),
        timestamp: certificateData.timestamp.toString(),

        // Private inputs (witness)
        certificateTitle: this.stringToFieldElement(certificateData.title),
        certificateDescription: this.stringToFieldElement(
          certificateData.description
        ),
        metadata: this.stringToFieldElement(
          JSON.stringify(certificateData.metadata)
        ),
        issuerPrivateKey: this.stringToFieldElement(issuerPrivateKey),
        salt: this.stringToFieldElement(salt),
      };

      // Generate proof using snarkjs
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );

      // Generate proof hash for easy verification
      const proofHash = sha256(
        JSON.stringify(proof) + JSON.stringify(publicSignals)
      );

      return {
        proof,
        publicSignals,
        proofHash,
      };
    } catch (error) {
      console.error("ZK proof generation failed:", error);
      throw new Error("Failed to generate ZK proof");
    }
  }

  /**
   * Verify ZK proof
   */
  async verifyProof(
    proof: any,
    publicSignals: string[],
    expectedCertificateHash?: string
  ): Promise<boolean> {
    try {
      if (!this.verificationKey) {
        throw new Error("Verification key not loaded");
      }

      // Verify the proof using snarkjs
      const isValid = await snarkjs.groth16.verify(
        this.verificationKey,
        publicSignals,
        proof
      );

      // Additional verification: check if certificate hash matches expected
      if (expectedCertificateHash && publicSignals[0]) {
        const providedHash = publicSignals[0];
        const expectedHashField = this.stringToFieldElement(
          expectedCertificateHash
        );
        if (providedHash !== expectedHashField) {
          return false;
        }
      }

      return isValid;
    } catch (error) {
      console.error("ZK proof verification failed:", error);
      return false;
    }
  }

  /**
   * Generate selective disclosure proof
   * Allows verifier to see only selected fields
   */
  async generateSelectiveDisclosureProof(
    certificateData: CertificateData,
    selectedFields: string[],
    issuerPrivateKey: string
  ): Promise<{
    proof: ZKProofData;
    disclosedData: Partial<CertificateData>;
    merkleProofs: any[];
  }> {
    try {
      const { tree, leaves } = this.generateMerkleTree(certificateData);
      const root = tree.getRoot().toString("hex");

      // Generate main proof
      const mainProof = await this.generateProof(
        certificateData,
        issuerPrivateKey
      );

      // Generate disclosed data and merkle proofs
      const disclosedData: Partial<CertificateData> = {};
      const merkleProofs: any[] = [];

      const fieldMapping: { [key: string]: keyof CertificateData } = {
        title: "title",
        description: "description",
        issuer: "issuer",
        holder: "holder",
        metadata: "metadata",
        timestamp: "timestamp",
      };

      selectedFields.forEach((field, index) => {
        if (fieldMapping[field]) {
          const fieldKey = fieldMapping[field];
          disclosedData[fieldKey] = certificateData[fieldKey];

          // Generate merkle proof for this field
          const leaf = leaves[index];
          const proof = tree.getProof(leaf);
          merkleProofs.push({
            field,
            value: certificateData[fieldKey],
            proof: proof.map((p) => ({
              position: p.position,
              data: p.data.toString("hex"),
            })),
            root,
          });
        }
      });

      return {
        proof: mainProof,
        disclosedData,
        merkleProofs,
      };
    } catch (error) {
      console.error("Selective disclosure proof generation failed:", error);
      throw new Error("Failed to generate selective disclosure proof");
    }
  }

  /**
   * Verify selective disclosure proof
   */
  async verifySelectiveDisclosureProof(
    proof: ZKProofData,
    // disclosedData: Partial<CertificateData>,
    merkleProofs: any[]
  ): Promise<boolean> {
    try {
      // Verify main ZK proof
      const isMainProofValid = await this.verifyProof(
        proof.proof,
        proof.publicSignals
      );

      if (!isMainProofValid) {
        return false;
      }

      // Verify merkle proofs for disclosed fields
      for (const merkleProof of merkleProofs) {
        const leaf = sha256(JSON.stringify(merkleProof.value));
        const proofArray = merkleProof.proof.map((p: any) => ({
          position: p.position,
          data: Buffer.from(p.data, "hex"),
        }));

        const tree = new MerkleTree([], sha256, { sortPairs: true });
        const isValidMerkleProof = tree.verify(
          proofArray,
          leaf,
          Buffer.from(merkleProof.root, "hex")
        );

        if (!isValidMerkleProof) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Selective disclosure verification failed:", error);
      return false;
    }
  }

  /**
   * Generate commitment for certificate (for privacy)
   */
  generateCommitment(data: CertificateData, nonce: string): string {
    const dataHash = this.generateCertificateHash(data);
    return sha256(dataHash + nonce);
  }

  /**
   * Verify commitment
   */
  verifyCommitment(
    commitment: string,
    data: CertificateData,
    nonce: string
  ): boolean {
    const expectedCommitment = this.generateCommitment(data, nonce);
    return commitment === expectedCommitment;
  }
}

export const zkpService = new ZKPService();
