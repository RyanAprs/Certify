import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isAddress, keccak256, parseAbiItem, toBytes } from "viem";
import toast from "react-hot-toast";
import { useState } from "react";

import { useHolderCertificates } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import { CertificateCard, Notice, Spinner } from "./Shared";
import { uploadJson } from "../lib/ipfs";
import { publicClient, registryContract, deploymentBlock } from "../lib/contract";

interface MembershipForm {
  issuer: string;
}
interface ShareForm {
  certificateId: string;
  verifier: string;
  fields: string;
}

function useMemberships(holder?: `0x${string}`) {
  return useQuery({
    enabled: Boolean(holder),
    queryKey: ["memberships", holder],
    queryFn: async () => {
      if (!holder) return [] as string[];
      const logs = await publicClient.getLogs({
        address: registryContract.address,
        event: parseAbiItem(
          "event MemberDecision(address indexed issuer, address indexed holder, bool approved)"
        ),
        args: { holder },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });
      return [
        ...new Set(
          logs.filter((l) => l.args.approved).map((l) => l.args.issuer as string)
        ),
      ];
    },
  });
}

export const HolderDashboard = () => {
  const { address } = useAccount();
  const { data: certificates, isLoading: certsLoading } =
    useHolderCertificates(address);
  const { data: memberships, isLoading: membershipsLoading } =
    useMemberships(address);
  const { write } = useRegistryWrite();

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const membershipForm = useForm<MembershipForm>({ defaultValues: { issuer: "" } });
  const shareForm = useForm<ShareForm>({
    defaultValues: { certificateId: "", verifier: "", fields: "{}" },
  });

  const onMembership = membershipForm.handleSubmit(async (values) => {
    setIsRequesting(true);
    try {
      await write("requestMembership", [values.issuer as `0x${string}`], {
        pending: "Requesting membership…",
        success: "Membership request sent",
      });
      membershipForm.reset();
    } catch {
      /* toast shown */
    } finally {
      setIsRequesting(false);
    }
  });

  const onShare = shareForm.handleSubmit(async (values) => {
    setIsSharing(true);
    try {
      let payload: unknown;
      try {
        payload = JSON.parse(values.fields);
      } catch {
        throw new Error("Disclosed fields must be valid JSON");
      }
      const certificate = certificates?.find(
        (c) => c.id === BigInt(values.certificateId)
      );
      if (!certificate) throw new Error("Certificate not found in your wallet");

      const queryHash = keccak256(toBytes(JSON.stringify(payload)));
      const encryptedPayloadCid = await uploadJson({
        payload,
        sharedAt: new Date().toISOString(),
      });

      await write(
        "shareCertificate",
        [
          BigInt(values.certificateId),
          values.verifier as `0x${string}`,
          queryHash,
          encryptedPayloadCid,
        ],
        { pending: "Sharing certificate…", success: "Certificate shared" }
      );
      shareForm.reset();
    } catch (err: any) {
      if (err?.message) toast.error(err.message);
    } finally {
      setIsSharing(false);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Holder Workspace</h2>
        <p className="text-sm text-slate-300">
          Manage certificate access and selective disclosure.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Join issuer */}
        <form
          onSubmit={onMembership}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Join Issuer</h3>
          <input
            className="input"
            placeholder="Issuer address (0x…)"
            disabled={isRequesting}
            {...membershipForm.register("issuer", {
              required: "Issuer address is required",
              validate: (v) => isAddress(v) || "Invalid Ethereum address",
            })}
          />
          {membershipForm.formState.errors.issuer && (
            <p className="text-xs text-red-400">
              {membershipForm.formState.errors.issuer.message}
            </p>
          )}
          <button className="btn-primary w-full" disabled={isRequesting}>
            {isRequesting ? "Processing…" : "Request Access"}
          </button>
        </form>

        {/* Share certificate */}
        <form
          onSubmit={onShare}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Share Certificate</h3>
          <input
            className="input"
            placeholder="Certificate ID"
            disabled={isSharing}
            {...shareForm.register("certificateId", { required: true })}
          />
          <input
            className="input"
            placeholder="Verifier address (0x…)"
            disabled={isSharing}
            {...shareForm.register("verifier", {
              required: "Verifier address is required",
              validate: (v) => isAddress(v) || "Invalid Ethereum address",
            })}
          />
          <textarea
            className="input min-h-[120px]"
            placeholder='{"field":"value"}'
            disabled={isSharing}
            {...shareForm.register("fields", { required: true })}
          />
          {shareForm.formState.errors.verifier && (
            <p className="text-xs text-red-400">
              {shareForm.formState.errors.verifier.message}
            </p>
          )}
          <button className="btn-secondary w-full" disabled={isSharing}>
            {isSharing ? "Processing…" : "Share Selectively"}
          </button>
        </form>
      </div>

      {/* Memberships */}
      <div className="space-y-3">
        {membershipsLoading && <Spinner label="Checking memberships…" />}
        {!membershipsLoading && (memberships?.length ?? 0) > 0 && (
          <div className="rounded-lg border border-green-700 bg-green-900/30 p-3">
            <p className="text-sm text-green-300">✅ You are a member of:</p>
            <ul className="mt-1 list-inside list-disc text-xs text-green-200">
              {memberships?.map((m) => (
                <li key={m} className="break-all">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="space-y-3">
        <h3 className="font-semibold">Certificates</h3>
        {certsLoading ? (
          <Spinner label="Loading certificates…" />
        ) : certificates && certificates.length > 0 ? (
          <div className="grid gap-4">
            {certificates.map((c) => (
              <CertificateCard key={c.id.toString()} certificate={c} />
            ))}
          </div>
        ) : (
          <Notice tone="info">You don't have any certificates yet.</Notice>
        )}
      </div>
    </section>
  );
};
