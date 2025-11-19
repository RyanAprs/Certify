export type CertificateStatus = "Pending" | "Active" | "Revoked";

export interface Certificate {
  id: bigint;
  issuer: `0x${string}`;
  holder: `0x${string}`;
  metadataCid: string;
  metadataCommitment: string;
  status: CertificateStatus;
  issuedAt: bigint;
}

export interface Disclosure {
  certificateId: bigint;
  verifier: `0x${string}`;
  queryHash: string;
  encryptedPayloadCid: string;
  timestamp: bigint;
}
