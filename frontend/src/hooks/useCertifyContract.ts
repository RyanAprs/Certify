import { useMemo } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CERTIFY_REGISTRY_ABI } from "../lib/abi";

const contractAddress = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const useCertifyReads = (functionName: string, args: any[] = []) => {
  return useReadContract({
    abi: CERTIFY_REGISTRY_ABI,
    address: contractAddress,
    functionName: functionName as any,
    args: args as any
  });
};

export const useCertifyWrites = () => {
  const write = useWriteContract();
  return useMemo(() => ({
    ...write,
    writeContract: (functionName: string, args: any[]) =>
      write.writeContract({ address: contractAddress, abi: CERTIFY_REGISTRY_ABI, functionName: functionName as any, args: args as any })
  }), [write]);
};

export const useWalletAccount = () => {
  const account = useAccount();
  return account;
};
