import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";

interface AuthState {
  address: `0x${string}` | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [sessionAddress, setSessionAddress] = useState<`0x${string}` | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const fetchSession = async () => {
    try {
      const { data } = await api.get<{ address: `0x${string}` }>(
        "/api/auth/me"
      );
      setSessionAddress(data.address);
    } catch {
      setSessionAddress(null);
    }
  };

  const login = async () => {
    if (!address || !chainId) throw new Error("Connect wallet first");
    setLoading(true);
    try {
      const { data } = await api.get<{ nonce: string }>("/api/auth/nonce");
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Certify",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: data.nonce,
      });
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });
      await api.post("/api/auth/verify", {
        message: message.prepareMessage(),
        signature,
      });
      await fetchSession();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setSessionAddress(null);
  };

  // 🔹 Auto-login SIWE saat wallet connect
  useEffect(() => {
    if (address && !sessionAddress) {
      login().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const value = useMemo<AuthState>(
    () => ({ address: sessionAddress, loading, login, logout }),
    [sessionAddress, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
