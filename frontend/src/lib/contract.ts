import { createPublicClient, http } from "viem";
import { CERTIFY_REGISTRY_ABI } from "./abi";
import { activeChain, RPC_URL } from "./wagmi";
import deployment from "./deployment.json";

// Address precedence: explicit env override, else the deployed address.
export const registryAddress = (import.meta.env.VITE_CONTRACT_ADDRESS ||
  deployment.registry) as `0x${string}`;

// Block the registry was deployed at — used to bound event-log queries instead
// of an arbitrary "last 100 blocks" window that silently dropped older data.
export const deploymentBlock = BigInt(deployment.deploymentBlock ?? 0);

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(RPC_URL),
});

export const registryContract = {
  address: registryAddress,
  abi: CERTIFY_REGISTRY_ABI,
} as const;

export function isContractConfigured(): boolean {
  return (
    !!registryAddress &&
    registryAddress !== "0x0000000000000000000000000000000000000000"
  );
}
