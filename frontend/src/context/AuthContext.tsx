import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { privateKeyToAccount } from "viem/accounts";

interface AuthState {
  address: `0x${string}` | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  devLogin: (privateKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [sessionAddress, setSessionAddress] = useState<`0x${string}` | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const fetchSession = async () => {
    try {
      const { data } = await api.get<{ address: `0x${string}` }>(
        "/api/auth/me"
      );
      setSessionAddress(data.address);
      return true;
    } catch {
      setSessionAddress(null);
      return false;
    }
  };

  // Check session saat pertama kali mount
  useEffect(() => {
    const checkInitialSession = async () => {
      setLoading(true);
      await fetchSession();
      setLoading(false);
      setInitialCheckDone(true);
    };
    checkInitialSession();
  }, []);

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
        message: message.toMessage(),
        signature,
      });

      await fetchSession();
    } finally {
      setLoading(false);
    }
  };

  const devLogin = async (privateKey: string) => {
    setLoading(true);
    try {
      const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      const CHAIN_ID = 31337;
      const account = privateKeyToAccount(pk as `0x${string}`);

      const { data } = await api.get<{ nonce: string }>("/api/auth/nonce");

      const message = new SiweMessage({
        domain: window.location.host,
        address: account.address,
        statement: "Sign in to Certify",
        uri: window.location.origin,
        version: "1",
        chainId: CHAIN_ID,
        nonce: data.nonce,
      });

      const preparedMessage = message.prepareMessage();

      const signature = await account.signMessage({
        message: preparedMessage,
      });

      await api.post("/api/auth/verify", {
        message: message.toMessage(),
        signature,
      });

      await fetchSession();
    } catch (error) {
      console.error("Dev login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setSessionAddress(null);
    localStorage.removeItem("privateKey");
  };

  // Auto-login SIWE saat wallet connect (hanya jika belum ada session)
  useEffect(() => {
    if (initialCheckDone && address && !sessionAddress) {
      login().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, initialCheckDone]);

  const value = useMemo<AuthState>(
    () => ({
      address: sessionAddress,
      loading,
      login,
      logout,
      devLogin,
    }),
    [sessionAddress, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
