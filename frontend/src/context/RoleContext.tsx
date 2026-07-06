import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { publicClient, CERTIFY_CONTRACT_ADDRESS, CERTIFY_ABI } from "../lib/viemLocal";

interface RoleState {
  isIssuer: boolean;
  roleLoading: boolean;
  refreshRole: () => void;
}

const RoleContext = createContext<RoleState | undefined>(undefined);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { address } = useAuth();
  const [isIssuer, setIsIssuer] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  const checkRole = async () => {
    if (!address) {
      setIsIssuer(false);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    try {
      const registered = await publicClient.readContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "registeredIssuers",
        args: [address],
      });
      setIsIssuer(registered as boolean);
    } catch {
      setIsIssuer(false);
    } finally {
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    checkRole();
  }, [address]);

  return (
    <RoleContext.Provider value={{ isIssuer, roleLoading, refreshRole: checkRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
};
