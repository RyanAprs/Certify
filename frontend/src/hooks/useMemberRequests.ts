import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import { publicClient, registryContract, deploymentBlock } from "../lib/contract";

export interface MemberRequests {
  pending: string[];
  approved: string[];
}

/** Pending + approved membership requests for an issuer (from event logs). */
export function useMemberRequests(issuer?: `0x${string}`) {
  return useQuery({
    enabled: Boolean(issuer),
    queryKey: ["memberRequests", issuer],
    queryFn: async (): Promise<MemberRequests> => {
      if (!issuer) return { pending: [], approved: [] };
      const logs = await publicClient.getLogs({
        address: registryContract.address,
        event: parseAbiItem(
          "event MemberRequested(address indexed issuer, address indexed holder)"
        ),
        args: { issuer },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });
      const holders = [
        ...new Set(logs.map((l) => (l.args.holder as string).toLowerCase())),
      ];
      const results = await Promise.all(
        holders.map(async (holder) => {
          const req = (await publicClient.readContract({
            ...registryContract,
            functionName: "memberRequests",
            args: [issuer, holder as `0x${string}`],
          })) as readonly [string, boolean, boolean];
          const [, approved, decided] = req;
          return { holder, approved, decided };
        })
      );
      return {
        pending: results.filter((r) => !r.decided).map((r) => r.holder),
        approved: results
          .filter((r) => r.decided && r.approved)
          .map((r) => r.holder),
      };
    },
  });
}
