import { useQuery } from "@tanstack/react-query";
import { registryContract, publicClient } from "../lib/contract";
import { Certificate, Disclosure } from "../types";

async function fetchCertificatesByIds(ids: bigint[]): Promise<Certificate[]> {
  return Promise.all(
    ids.map(async (id) => {
      const data = await publicClient.readContract({ ...registryContract, functionName: "certificates", args: [id] });
      const [certId, issuer, holder, metadataCid, metadataCommitment, statusEnum, issuedAt] = data as any;
      const status = statusEnum === 0 ? "Pending" : statusEnum === 1 ? "Active" : "Revoked";
      return {
        id: certId,
        issuer,
        holder,
        metadataCid,
        metadataCommitment,
        status,
        issuedAt
      } satisfies Certificate;
    })
  );
}

export const useIssuerCertificates = (issuer?: `0x${string}`) => {
  return useQuery({
    enabled: Boolean(issuer),
    queryKey: ["issuerCertificates", issuer],
    queryFn: async () => {
      if (!issuer) return [];
      const ids = (await publicClient.readContract({ ...registryContract, functionName: "getIssuerCertificates", args: [issuer] })) as bigint[];
      return fetchCertificatesByIds(ids);
    }
  });
};

export const useHolderCertificates = (holder?: `0x${string}`) => {
  return useQuery({
    enabled: Boolean(holder),
    queryKey: ["holderCertificates", holder],
    queryFn: async () => {
      if (!holder) return [];
      const ids = (await publicClient.readContract({ ...registryContract, functionName: "getHolderCertificates", args: [holder] })) as bigint[];
      return fetchCertificatesByIds(ids);
    }
  });
};

export const useDisclosures = (certificateId?: bigint) =>
  useQuery({
    enabled: Boolean(certificateId),
    queryKey: ["disclosures", certificateId?.toString() ?? "0"],
    queryFn: async () => {
      if (!certificateId) return [] as Disclosure[];
      const disclosures = (await publicClient.readContract({ ...registryContract, functionName: "getDisclosures", args: [certificateId] })) as any[];
      return disclosures.map((item) => ({
        certificateId: item.certificateId,
        verifier: item.verifier,
        queryHash: item.queryHash,
        encryptedPayloadCid: item.encryptedPayloadCid,
        timestamp: item.timestamp
      })) as Disclosure[];
    }
  });
