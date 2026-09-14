import { useAccount, useReadContract } from "wagmi";
import { registryContract } from "../lib/contract";

// AccessControl's DEFAULT_ADMIN_ROLE is bytes32(0).
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export interface RoleState {
  address?: `0x${string}`;
  isConnected: boolean;
  isIssuer: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Derives the connected wallet's on-chain role. Replaces the old model where a
 * user simply *clicked* "I am an Issuer" with no enforcement.
 */
export function useRole(): RoleState {
  const { address, isConnected } = useAccount();
  const enabled = Boolean(address);

  const { data: isIssuer, isLoading: loadingIssuer } = useReadContract({
    ...registryContract,
    functionName: "registeredIssuers",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: isAdmin, isLoading: loadingAdmin } = useReadContract({
    ...registryContract,
    functionName: "hasRole",
    args: address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
    query: { enabled },
  });

  return {
    address,
    isConnected,
    isIssuer: Boolean(isIssuer),
    isAdmin: Boolean(isAdmin),
    isLoading: enabled && (loadingIssuer || loadingAdmin),
  };
}
