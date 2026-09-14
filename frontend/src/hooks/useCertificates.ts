import { useQuery } from "@tanstack/react-query";
import { registryContract, publicClient } from "../lib/contract";
import { Certificate, CertificateStatus, Disclosure } from "../types";

function toStatus(statusEnum: number): CertificateStatus {
  // On-chain enum: 0=Pending, 1=Active, 2=Revoked.
  return statusEnum === 0 ? "Pending" : statusEnum === 1 ? "Active" : "Revoked";
}

async function fetchCertificatesByIds(ids: bigint[]): Promise<Certificate[]> {
  return Promise.all(
    ids.map(async (id) => {
      const data = (await publicClient.readContract({
        ...registryContract,
        functionName: "certificates",
        args: [id],
      })) as readonly [
        bigint,
        `0x${string}`,
        `0x${string}`,
        string,
        `0x${string}`,
        number,
        bigint
      ];
      const [certId, issuer, holder, metadataCid, metadataCommitment, statusEnum, issuedAt] =
        data;
      return {
        id: certId,
        issuer,
        holder,
        metadataCid,
        metadataCommitment,
        status: toStatus(Number(statusEnum)),
        issuedAt,
      } satisfies Certificate;
    })
  );
}

export const useIssuerCertificates = (issuer?: `0x${string}`) =>
  useQuery({
    enabled: Boolean(issuer),
    queryKey: ["issuerCertificates", issuer],
    queryFn: async () => {
      if (!issuer) return [];
      const ids = (await publicClient.readContract({
        ...registryContract,
        functionName: "getIssuerCertificates",
        args: [issuer],
      })) as bigint[];
      return fetchCertificatesByIds(ids);
    },
  });

export const useHolderCertificates = (holder?: `0x${string}`) =>
  useQuery({
    enabled: Boolean(holder),
    queryKey: ["holderCertificates", holder],
    queryFn: async () => {
      if (!holder) return [];
      const ids = (await publicClient.readContract({
        ...registryContract,
        functionName: "getHolderCertificates",
        args: [holder],
      })) as bigint[];
      return fetchCertificatesByIds(ids);
    },
  });

export const useDisclosures = (certificateId?: bigint) =>
  useQuery({
    enabled: Boolean(certificateId),
    queryKey: ["disclosures", certificateId?.toString() ?? "0"],
    queryFn: async () => {
      if (certificateId === undefined) return [] as Disclosure[];
      const disclosures = (await publicClient.readContract({
        ...registryContract,
        functionName: "getDisclosures",
        args: [certificateId],
      })) as any[];
      return disclosures.map((item) => ({
        certificateId: item.certificateId,
        verifier: item.verifier,
        queryHash: item.queryHash,
        encryptedPayloadCid: item.encryptedPayloadCid,
        timestamp: item.timestamp,
      })) as Disclosure[];
    },
  });
