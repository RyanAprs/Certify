// import { createPublicClient, createWalletClient, custom, http } from "viem";
// import { sepolia } from "viem/chains";
// import { CERTIFY_REGISTRY_ABI } from "./abi";

// const contractAddress = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

// export const publicClient = createPublicClient({
//   chain: sepolia,
//   transport: http(import.meta.env.VITE_RPC_URL)
// });

// export const getWalletClient = async () => {
//   if (!(window as any).ethereum) throw new Error("Wallet not found");
//   return createWalletClient({
//     chain: sepolia,
//     transport: custom((window as any).ethereum)
//   });
// };

// export const registryContract = {
//   address: contractAddress,
//   abi: CERTIFY_REGISTRY_ABI
// };

// LOCAL NETWORK
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { CERTIFY_REGISTRY_ABI } from "./abi";

interface Chain {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[] } };
  blockExplorers?: { default: { name: string; url: string } };
  testnet?: boolean;
  // lainnya optional
}

const contractAddress = (import.meta.env.VITE_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Hardhat Local chain config lengkap
const hardhatLocalChain = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "Hardhat Explorer", url: "http://127.0.0.1:8545" },
  },
  testnet: true,
};

// Public client mengarah ke Hardhat node lokal
export const publicClient = createPublicClient({
  chain: hardhatLocalChain,
  transport: http("http://127.0.0.1:8545"),
});

// Wallet client untuk sign transactions via window.ethereum (MetaMask)
export const getWalletClient = async () => {
  if (!(window as any).ethereum) throw new Error("Wallet not found");
  return createWalletClient({
    chain: hardhatLocalChain,
    transport: custom((window as any).ethereum),
  });
};

// Kontrak registry
export const registryContract = {
  address: contractAddress,
  abi: CERTIFY_REGISTRY_ABI,
};
