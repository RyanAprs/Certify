import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";
import { PinataSDK } from "pinata";
import { useAuth } from "./AuthContext";

interface Certificate {
  id: string;
  issuer: string;
  holder: string;
  title: string;
  description: string;
  ipfsHash: string;
  zkProof: string;
  metadata: string;
  issuedAt: bigint;
  isValid: boolean;
}

interface CertificateContextType {
  certificates: Certificate[];
  loading: boolean;
  uploadToIPFS: (file: File) => Promise<string>;
  issueCertificate: (data: any) => Promise<void>;
  getCertificates: () => Promise<void>;
  verifyCertificate: (
    certificateId: string,
    zkProof: string
  ) => Promise<boolean>;
}

const CertificateContext = createContext<CertificateContextType | undefined>(
  undefined
);

export const useCertificate = () => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error("useCertificate must be used within a CertificateProvider");
  }
  return context;
};

interface CertificateProviderProps {
  children: ReactNode;
}

export const CertificateProvider: React.FC<CertificateProviderProps> = ({
  children,
}) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const { actor, user } = useAuth();

  const pinata = new PinataSDK({
    pinataJwt: process.env.REACT_APP_PINATA_JWT || "",
    pinataGateway: process.env.REACT_APP_PINATA_GATEWAY || "",
  });

  const uploadToIPFS = async (file: File): Promise<string> => {
    try {
      const upload = await pinata.upload.file(file);
      return upload.IpfsHash;
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw error;
    }
  };

  const generateZKProof = async (certificateData: any): Promise<string> => {
    // Simplified ZK proof generation
    // In production, use proper ZK libraries like snarkjs
    const dataString = JSON.stringify(certificateData);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const issueCertificate = async (data: {
    holderId: string;
    title: string;
    description: string;
    file: File;
    metadata: any;
  }) => {
    if (!actor) throw new Error("Not authenticated");

    try {
      setLoading(true);

      // Upload file to IPFS
      const ipfsHash = await uploadToIPFS(data.file);

      // Generate ZK proof
      const zkProof = await generateZKProof({
        title: data.title,
        description: data.description,
        ipfsHash,
        metadata: data.metadata,
      });

      // Issue certificate on blockchain
      const result = await actor.issueCertificate(
        data.holderId,
        data.title,
        data.description,
        ipfsHash,
        zkProof,
        JSON.stringify(data.metadata)
      );

      if ("err" in result) {
        throw new Error(result.err);
      }

      await getCertificates();
    } catch (error) {
      console.error("Certificate issuance failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCertificates = async () => {
    if (!actor || !user) return;

    try {
      setLoading(true);
      let result;

      if (user.role === "Issuer") {
        result = await actor.getIssuerCertificates();
      } else if (user.role === "Holder") {
        result = await actor.getHolderCertificates();
      } else {
        result = [];
      }

      setCertificates(result);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyCertificate = async (
    certificateId: string,
    zkProof: string
  ): Promise<boolean> => {
    if (!actor) throw new Error("Not authenticated");

    try {
      const result = await actor.verifyCertificate(certificateId, zkProof);
      return "ok" in result ? result.ok : false;
    } catch (error) {
      console.error("Certificate verification failed:", error);
      return false;
    }
  };

  const value: CertificateContextType = {
    certificates,
    loading,
    uploadToIPFS,
    issueCertificate,
    getCertificates,
    verifyCertificate,
  };

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  );
};
