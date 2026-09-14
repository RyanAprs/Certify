import { createContext, useContext } from "react";
import { useAccount, useReadContract } from "wagmi";
import { registryContract } from "../lib/contract";

// AccessControl's DEFAULT_ADMIN_ROLE is bytes32(0).
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

interface RoleState {
  address?: `0x${string}`;
  isConnected: boolean;
  isIssuer: boolean;
  isAdmin: boolean;
  roleLoading: boolean;
  refreshRole: () => void;
}

const RoleContext = createContext<RoleState | undefined>(undefined);

/**
 * Derives the connected wallet's on-chain role (registered issuer / admin).
 * Replaces the previous model where the role was read via a raw-private-key
 * viem client and the user simply *picked* a role with no enforcement.
 */
export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, isConnected } = useAccount();
  const enabled = Boolean(address);

  const {
    data: isIssuer,
    isLoading: loadingIssuer,
    refetch: refetchIssuer,
  } = useReadContract({
    ...registryContract,
    functionName: "registeredIssuers",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const {
    data: isAdmin,
    isLoading: loadingAdmin,
    refetch: refetchAdmin,
  } = useReadContract({
    ...registryContract,
    functionName: "hasRole",
    args: address ? [DEFAULT_ADMIN_ROLE, address] : undefined,
    query: { enabled },
  });

  const value: RoleState = {
    address,
    isConnected,
    isIssuer: Boolean(isIssuer),
    isAdmin: Boolean(isAdmin),
    roleLoading: enabled && (loadingIssuer || loadingAdmin),
    refreshRole: () => {
      refetchIssuer();
      refetchAdmin();
    },
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
