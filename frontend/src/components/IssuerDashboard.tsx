import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isAddress, parseAbiItem } from "viem";
import toast from "react-hot-toast";
import { useState } from "react";

import { useIssuerCertificates } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import { useRole } from "../context/RoleContext";
import { CertificateCard, Notice, Spinner } from "./Shared";
import { uploadFile, uploadJson } from "../lib/ipfs";
import { publicClient, registryContract, deploymentBlock } from "../lib/contract";
import {
  CertificateMetadata,
  commitmentFromMetadata,
  generateSecret,
} from "../lib/zkp";

interface IssueForm {
  holder: string;
  name: string;
  institution: string;
  program: string;
  gpa: string;
  description: string;
  image: FileList;
}

function useMemberRequests(issuer?: `0x${string}`) {
  return useQuery({
    enabled: Boolean(issuer),
    queryKey: ["memberRequests", issuer],
    queryFn: async () => {
      if (!issuer) return { pending: [] as string[], approved: [] as string[] };
      const logs = await publicClient.getLogs({
        address: registryContract.address,
        event: parseAbiItem(
          "event MemberRequested(address indexed issuer, address indexed holder)"
        ),
        args: { issuer },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });
      const holders = [
        ...new Set(logs.map((l) => (l.args.holder as string).toLowerCase())),
      ];
      const results = await Promise.all(
        holders.map(async (holder) => {
          const req = (await publicClient.readContract({
            ...registryContract,
            functionName: "memberRequests",
            args: [issuer, holder as `0x${string}`],
          })) as readonly [string, boolean, boolean];
          const [, approved, decided] = req;
          return { holder, approved, decided };
        })
      );
      return {
        pending: results.filter((r) => !r.decided).map((r) => r.holder),
        approved: results
          .filter((r) => r.decided && r.approved)
          .map((r) => r.holder),
      };
    },
  });
}

export const IssuerDashboard = () => {
  const { address } = useAccount();
  const { data: certificates } = useIssuerCertificates(address);
  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useMemberRequests(address);
  const { write } = useRegistryWrite();
  const { refreshRole } = useRole();

  const [processing, setProcessing] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);

  const form = useForm<IssueForm>({
    defaultValues: {
      holder: "",
      name: "",
      institution: "",
      program: "",
      gpa: "",
      description: "",
    },
  });

  const onDecision = async (holder: string, approve: boolean) => {
    setProcessing(holder);
    try {
      await write("manageMember", [holder, approve], {
        pending: approve ? "Approving member…" : "Rejecting member…",
        success: approve ? "Member approved" : "Member rejected",
      });
      await refetchMembers();
    } catch {
      /* toast already shown */
    } finally {
      setProcessing(null);
    }
  };

  const onIssue = form.handleSubmit(async (values) => {
    setIsIssuing(true);
    try {
      const file = values.image?.item(0);
      if (!file) throw new Error("Certificate image is required");

      const imageCid = await toast.promise(uploadFile(file), {
        loading: "Uploading image to IPFS…",
        success: "Image uploaded",
        error: "Image upload failed",
      });

      // The secret blinds the on-chain commitment; the holder needs it later to
      // prove their GPA. NOTE: in production this metadata should be encrypted
      // to the holder so only they can read `secret`/`gpa`.
      const secret = generateSecret();
      const metadata: CertificateMetadata = {
        name: values.name,
        institution: values.institution,
        program: values.program,
        gpa: values.gpa,
        description: values.description,
        imageCid,
        issuedAt: new Date().toISOString(),
        secret,
      };

      const metadataCid = await uploadJson(metadata);
      // Poseidon(gpa, secret) — the SAME commitment the ZK circuit reproduces,
      // so on-chain verification can actually succeed (previously this used a
      // keccak of unordered JSON that never matched the circuit).
      const metadataCommitment = commitmentFromMetadata(metadata);

      await write(
        "issueCertificate",
        [values.holder as `0x${string}`, metadataCid, metadataCommitment],
        { pending: "Issuing certificate…", success: "Certificate issued" }
      );
      form.reset();
    } catch (err: any) {
      if (err?.message) toast.error(err.message);
    } finally {
      setIsIssuing(false);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Issuer Workspace</h2>
        <p className="text-sm text-slate-300">
          Issue certificates (with an IPFS image) and manage holder access.
        </p>
      </header>

      {/* Create Certificate */}
      <form
        onSubmit={onIssue}
        className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
      >
        <h3 className="font-semibold">Create Certificate</h3>

        <Field label="Holder address" error={form.formState.errors.holder?.message}>
          <input
            className="input"
            placeholder="0x…"
            disabled={isIssuing}
            {...form.register("holder", {
              required: "Holder address is required",
              validate: (v) => isAddress(v) || "Invalid Ethereum address",
            })}
          />
        </Field>

        <Field label="Name" error={form.formState.errors.name?.message}>
          <input className="input" disabled={isIssuing}
            {...form.register("name", { required: "Name is required" })} />
        </Field>
        <Field label="Institution">
          <input className="input" disabled={isIssuing}
            {...form.register("institution", { required: true })} />
        </Field>
        <Field label="Program">
          <input className="input" disabled={isIssuing}
            {...form.register("program", { required: true })} />
        </Field>
        <Field label="GPA (0–5)" error={form.formState.errors.gpa?.message}>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            max="5"
            disabled={isIssuing}
            {...form.register("gpa", {
              required: "GPA is required",
              validate: (v) => {
                const n = parseFloat(v);
                return (!isNaN(n) && n >= 0 && n <= 5) || "GPA must be between 0 and 5";
              },
            })}
          />
        </Field>
        <Field label="Description">
          <textarea className="input min-h-[80px]" disabled={isIssuing}
            {...form.register("description", { required: true })} />
        </Field>
        <Field label="Certificate image (PNG/JPEG)">
          <input className="input" type="file" accept="image/*" disabled={isIssuing}
            {...form.register("image", { required: true })} />
        </Field>

        <button className="btn-primary w-full" disabled={isIssuing}>
          {isIssuing ? "Issuing…" : "Issue Certificate"}
        </button>
      </form>

      {/* Membership */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pending Requests</h3>
          <button
            onClick={() => {
              refetchMembers();
              refreshRole();
            }}
            disabled={membersLoading}
            className="text-xs uppercase tracking-wide text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {membersLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {membersLoading && <Spinner label="Loading members…" />}
        {!membersLoading && (members?.pending.length ?? 0) === 0 && (
          <p className="text-sm text-slate-400">No pending requests.</p>
        )}
        {members?.pending.map((holder) => (
          <div
            key={holder}
            className="flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-800 p-3 md:flex-row"
          >
            <p className="break-all font-mono text-sm">{holder}</p>
            <div className="flex gap-3">
              <button
                onClick={() => onDecision(holder, true)}
                disabled={processing === holder}
                className="btn-secondary disabled:opacity-50"
              >
                {processing === holder ? "…" : "Approve"}
              </button>
              <button
                onClick={() => onDecision(holder, false)}
                disabled={processing === holder}
                className="btn-danger disabled:opacity-50"
              >
                {processing === holder ? "…" : "Reject"}
              </button>
            </div>
          </div>
        ))}

        <h3 className="mt-6 font-semibold">Approved Members</h3>
        {(members?.approved.length ?? 0) === 0 && (
          <p className="text-sm text-slate-400">No members yet.</p>
        )}
        {members?.approved.map((member) => (
          <div key={member} className="rounded-lg border border-slate-800 p-3">
            <p className="break-all font-mono text-sm">{member}</p>
          </div>
        ))}
      </div>

      {/* Issued certificates */}
      <div className="space-y-3">
        <h3 className="font-semibold">Certificates</h3>
        <div className="grid gap-4">
          {certificates && certificates.length > 0 ? (
            certificates.map((c) => (
              <CertificateCard key={c.id.toString()} certificate={c} />
            ))
          ) : (
            <Notice tone="info">No certificates issued yet.</Notice>
          )}
        </div>
      </div>
    </section>
  );
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-400">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-400">{error}</span>}
    </label>
  );
}
