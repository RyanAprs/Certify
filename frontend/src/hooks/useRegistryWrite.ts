import { useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import toast from "react-hot-toast";
import { registryContract } from "../lib/contract";

/**
 * Wallet-based contract writes via the connected account (wagmi), replacing the
 * old raw-private-key-in-localStorage flow. Handles the submit → confirm
 * lifecycle and surfaces toast feedback with a block-explorer-free, chain-safe
 * message.
 */
export function useRegistryWrite() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);

  async function write(
    functionName: string,
    args: unknown[],
    messages?: { pending?: string; success?: string }
  ): Promise<`0x${string}`> {
    if (!publicClient) throw new Error("No RPC client available");
    setIsPending(true);
    const toastId = toast.loading(messages?.pending ?? "Submitting transaction…");
    try {
      const hash = await writeContractAsync({
        ...registryContract,
        functionName: functionName as any,
        args: args as any,
      });
      toast.loading("Waiting for confirmation…", { id: toastId });
      await publicClient.waitForTransactionReceipt({ hash });
      toast.success(messages?.success ?? "Transaction confirmed", { id: toastId });
      return hash;
    } catch (err: any) {
      const short =
        err?.shortMessage || err?.message || "Transaction failed";
      toast.error(short, { id: toastId });
      throw err;
    } finally {
      setIsPending(false);
    }
  }

  return { write, isPending };
}
