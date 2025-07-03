import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";
import { idlFactory } from "../../../declarations/Certify_backend";
import { canisterId as CANISTER_ID_INTERNET_IDENTITY } from "../../../declarations/internet_identity";
import { canisterId as CANISTER_ID_BACKEND } from "../../../declarations/Certify_backend";

const DFX_NETWORK = import.meta.env.VITE_DFX_NETWORK || "local";

console.log(CANISTER_ID_BACKEND);

interface User {
  id: Principal;
  role: "Issuer" | "Holder" | "Verifier";
  name: string;
  email: string;
  registeredAt: bigint;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  actor: any;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (
    name: string,
    email: string,
    role: "Issuer" | "Holder" | "Verifier"
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [actor, setActor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        await handleAuthenticated(client);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = async (client: AuthClient) => {
    const identity = client.getIdentity();
    const agent = new HttpAgent({ identity });

    if (DFX_NETWORK === "local") {
      try {
        await agent.fetchRootKey();
      } catch (error) {
        console.warn("Failed to fetch root key:", error);
      }
    }

    const actorInstance = Actor.createActor(idlFactory, {
      agent,
      canisterId: CANISTER_ID_BACKEND,
    });

    setActor(actorInstance);
    setIsAuthenticated(true);

    try {
      const result = await actorInstance.getUser();

      console.log(result);

      if ("ok" in result) {
        setUser(result.ok);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const login = async () => {
    if (!authClient) return;

    try {
      await authClient.login({
        identityProvider:
          DFX_NETWORK === "local"
            ? `http://${CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`
            : "https://identity.ic0.app",
        onSuccess: () => handleAuthenticated(authClient),
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      setIsAuthenticated(false);
      setUser(null);
      setActor(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    role: "Issuer" | "Holder" | "Verifier"
  ) => {
    if (!actor) throw new Error("Not authenticated");

    try {
      const roleVariant = { [role]: null };
      const result = await actor.registerUser(name, email, roleVariant);

      if ("ok" in result) {
        setUser(result.ok);
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    actor,
    loading,
    login,
    logout,
    registerUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
