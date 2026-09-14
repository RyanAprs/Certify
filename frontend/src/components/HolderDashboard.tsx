import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isAddress, keccak256, parseAbiItem, toBytes } from "viem";
import toast from "react-hot-toast";
import { useState } from "react";
import { GraduationCap, UserPlus, Share2, BadgeCheck, FileText } from "lucide-react";

import { useHolderCertificates } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import {
  CertificateCard,
  DataChip,
  EmptyState,
  Field,
  PageHeader,
  SkeletonCard,
} from "./Shared";
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
  const { data: memberships } = useMemberships(address);
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
    <section>
      <PageHeader
        icon={<GraduationCap size={22} aria-hidden="true" />}
        eyebrow="Workspace"
        title="Holder"
        description="Collect your credentials and share them selectively with a zero-knowledge proof."
        aside={address ? <DataChip label="signed in" value={address} /> : undefined}
      />

      {memberships && memberships.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-valid/25 bg-valid-tint px-4 py-3">
          <BadgeCheck size={16} className="text-valid-ink" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">Member of</span>
          {memberships.map((m) => (
            <DataChip key={m} value={m} />
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Join issuer */}
        <form onSubmit={onMembership} className="panel-pad space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">Join an issuer</h2>
          </div>
          <p className="text-sm text-ink-muted">
            Request membership so an institution can issue certificates to you.
          </p>
          <Field
            label="Issuer address"
            error={membershipForm.formState.errors.issuer?.message}
          >
            <input
              className="input-mono"
              placeholder="0x…"
              disabled={isRequesting}
              {...membershipForm.register("issuer", {
                required: "Issuer address is required",
                validate: (v) => isAddress(v) || "Enter a valid Ethereum address",
              })}
            />
          </Field>
          <button className="btn-primary w-full" disabled={isRequesting}>
            <UserPlus size={16} aria-hidden="true" />
            {isRequesting ? "Requesting…" : "Request access"}
          </button>
        </form>

        {/* Share */}
        <form onSubmit={onShare} className="panel-pad space-y-4">
          <div className="flex items-center gap-2">
            <Share2 size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">Share a certificate</h2>
          </div>
          <p className="text-sm text-ink-muted">
            Disclose selected fields to a verifier; the payload is stored on IPFS.
          </p>
          <Field label="Certificate ID">
            <input
              className="input"
              placeholder="e.g. 1"
              disabled={isSharing}
              {...shareForm.register("certificateId", { required: true })}
            />
          </Field>
          <Field
            label="Verifier address"
            error={shareForm.formState.errors.verifier?.message}
          >
            <input
              className="input-mono"
              placeholder="0x…"
              disabled={isSharing}
              {...shareForm.register("verifier", {
                required: "Verifier address is required",
                validate: (v) => isAddress(v) || "Enter a valid Ethereum address",
              })}
            />
          </Field>
          <Field label="Disclosed fields" hint="Valid JSON">
            <textarea
              className="input-mono min-h-[92px] resize-y"
              placeholder='{"program":"B.Sc. CS"}'
              disabled={isSharing}
              {...shareForm.register("fields", { required: true })}
            />
          </Field>
          <button className="btn-secondary w-full" disabled={isSharing}>
            <Share2 size={16} aria-hidden="true" />
            {isSharing ? "Sharing…" : "Share selectively"}
          </button>
        </form>
      </div>

      {/* Certificates */}
      <div className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          Your credentials
        </h2>
        {certsLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {certificates.map((c) => (
              <CertificateCard key={c.id.toString()} certificate={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<FileText size={28} />} title="No credentials yet">
            Once an issuer you've joined grants you a certificate, it will appear
            here — ready to share with a zero-knowledge proof.
          </EmptyState>
        )}
      </div>
    </section>
  );
};
