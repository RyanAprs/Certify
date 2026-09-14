import { http } from "wagmi";
import { defineChain } from "viem";
import { hardhat, sepolia } from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import deployment from "./deployment.json";

// Single RPC + chain source. The deployed chain id comes from deployment.json
// (written by the deploy script); the RPC can be overridden via env.
export const RPC_URL: string =
  import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

const CHAIN_ID: number = deployment.chainId || 31337;

function resolveChain() {
  if (CHAIN_ID === hardhat.id) {
    return { ...hardhat, rpcUrls: { default: { http: [RPC_URL] } } };
  }
  if (CHAIN_ID === sepolia.id) {
    return sepolia;
  }
  return defineChain({
    id: CHAIN_ID,
    name: `Chain ${CHAIN_ID}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  });
}

export const activeChain = resolveChain();

// RainbowKit's getDefaultConfig builds the wagmi config + wallet connectors.
export const wagmiConfig = getDefaultConfig({
  appName: "Certify",
  projectId: import.meta.env.VITE_WALLETCONNECT_ID || "demo",
  chains: [activeChain],
  transports: { [activeChain.id]: http(RPC_URL) },
  ssr: false,
});
