import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isAddress, parseAbiItem } from "viem";
import toast from "react-hot-toast";
import { useState } from "react";
import { Stamp, UserCheck, UserX, Users, Inbox, FileText, ShieldPlus, X } from "lucide-react";
import clsx from "clsx";

import { useIssuerCertificates } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import { useRole } from "../context/RoleContext";
import {
  CertificateCard,
  DataChip,
  EmptyState,
  Field,
  PageHeader,
  Skeleton,
  SkeletonCard,
} from "./Shared";
import { uploadFile, uploadJson } from "../lib/ipfs";
import { publicClient, registryContract, deploymentBlock } from "../lib/contract";
import { SCHEMAS, Schema } from "../lib/schemas";
import { CredentialMetadata, buildCommitment } from "../lib/zkp";

type IssueForm = {
  holder: string;
  display: Record<string, string>;
  claims: Record<string, string>;
  image: FileList;
};

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

function useRegisteredIssuers() {
  return useQuery({
    queryKey: ["registeredIssuers"],
    queryFn: async () => {
      const logs = await publicClient.getLogs({
        address: registryContract.address,
        event: parseAbiItem(
          "event IssuerRegistered(address indexed issuer, address indexed creator)"
        ),
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });
      const candidates = [...new Set(logs.map((l) => l.args.issuer as string))];
      // Keep only those still registered (a removed issuer's event still exists).
      const checked = await Promise.all(
        candidates.map(async (a) => ({
          a,
          ok: (await publicClient.readContract({
            ...registryContract,
            functionName: "registeredIssuers",
            args: [a as `0x${string}`],
          })) as boolean,
        }))
      );
      return checked.filter((x) => x.ok).map((x) => x.a);
    },
  });
}

export const IssuerDashboard = () => {
  const { address } = useAccount();
  const { data: certificates, isLoading: certsLoading } =
    useIssuerCertificates(address);
  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useMemberRequests(address);
  const { write } = useRegistryWrite();
  const { isAdmin, refreshRole } = useRole();
  const { data: issuers, refetch: refetchIssuers } = useRegisteredIssuers();

  const [schema, setSchema] = useState<Schema>(SCHEMAS[0]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuerAddr, setIssuerAddr] = useState("");
  const [registering, setRegistering] = useState(false);
  const [removingIssuer, setRemovingIssuer] = useState<string | null>(null);

  const form = useForm<IssueForm>({ defaultValues: { holder: "", display: {}, claims: {} } });
  const { errors } = form.formState;

  const onRemoveIssuer = async (addr: string) => {
    setRemovingIssuer(addr);
    try {
      await write("removeIssuer", [addr as `0x${string}`], {
        pending: "Removing issuer…",
        success: "Issuer removed",
      });
      await refetchIssuers();
    } catch {
      /* toast shown */
    } finally {
      setRemovingIssuer(null);
    }
  };

  const onRegisterIssuer = async () => {
    if (!isAddress(issuerAddr)) return toast.error("Enter a valid Ethereum address");
    setRegistering(true);
    try {
      await write("registerIssuer", [issuerAddr as `0x${string}`], {
        pending: "Registering issuer…",
        success: "Issuer registered",
      });
      setIssuerAddr("");
      await refetchIssuers();
    } catch {
      /* toast shown */
    } finally {
      setRegistering(false);
    }
  };

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

      const rawClaims: Record<string, number | string> = {};
      for (const f of schema.claims) {
        const raw = values.claims[f.key];
        if (f.kind === "string") rawClaims[f.key] = raw;
        else if (f.kind === "timestamp")
          rawClaims[f.key] = Math.floor(new Date(raw).getTime() / 1000);
        else rawClaims[f.key] = parseFloat(raw);
      }

      // Merkle root of the claims — computed here so it matches the circuit.
      const { rootHex, salts } = buildCommitment(schema, rawClaims);

      const imageCid = await toast.promise(uploadFile(file), {
        loading: "Uploading image to IPFS…",
        success: "Image uploaded",
        error: "Image upload failed",
      });

      const metadata: CredentialMetadata = {
        schemaId: schema.id,
        type: schema.type,
        name: values.display.name ?? "",
        institution: values.display.institution ?? "",
        program: values.display.program ?? "",
        description: values.display.description ?? "",
        imageCid,
        issuedAt: new Date().toISOString(),
        claims: rawClaims,
        salts,
      };

      const metadataCid = await uploadJson(metadata);
      await write(
        "issueCertificate",
        [values.holder as `0x${string}`, metadataCid, rootHex, schema.id],
        { pending: "Issuing certificate…", success: "Certificate issued" }
      );
      form.reset({ holder: "", display: {}, claims: {} });
    } catch (err: any) {
      if (err?.message) toast.error(err.message);
    } finally {
      setIsIssuing(false);
    }
  });

  return (
    <section>
      <PageHeader
        icon={<Stamp size={22} aria-hidden="true" />}
        eyebrow="Workspace"
        title="Issuer"
        description="Issue academic and competency credentials, and manage which holders can receive them."
        aside={address ? <DataChip label="signed in" value={address} /> : undefined}
      />

      {isAdmin && (
        <div className="panel-pad mb-6 border-primary/30 bg-primary-tint/40">
          <div className="mb-1 flex items-center gap-2">
            <ShieldPlus size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">Admin · issuer registry</h2>
          </div>
          <p className="mb-4 text-sm text-ink-muted">
            Authorize another wallet to issue credentials.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="input-mono flex-1"
              placeholder="0x… wallet to authorize"
              value={issuerAddr}
              onChange={(e) => setIssuerAddr(e.target.value)}
            />
            <button
              className="btn-secondary sm:w-48"
              onClick={onRegisterIssuer}
              disabled={registering}
            >
              <ShieldPlus size={16} aria-hidden="true" />
              {registering ? "Registering…" : "Register issuer"}
            </button>
          </div>
          {issuers && issuers.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-subtle">
                Registered issuers
              </p>
              <ul className="flex flex-wrap gap-2">
                {issuers.map((a) => (
                  <li key={a} className="flex items-center gap-1">
                    <DataChip value={a} />
                    {a.toLowerCase() !== address?.toLowerCase() && (
                      <button
                        onClick={() => onRemoveIssuer(a)}
                        disabled={removingIssuer === a}
                        aria-label="Remove issuer"
                        className="rounded-md p-1 text-ink-subtle transition hover:bg-danger-tint hover:text-danger-ink disabled:opacity-50"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Issue */}
        <form onSubmit={onIssue} className="panel-pad space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">Issue a credential</h2>
          </div>

          {/* Credential type */}
          <div>
            <span className="label">Credential type</span>
            <div className="grid grid-cols-2 gap-2">
              {SCHEMAS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSchema(s);
                    form.resetField("claims");
                  }}
                  className={clsx(
                    "rounded-md border px-3 py-2 text-left text-sm transition",
                    s.id === schema.id
                      ? "border-primary bg-primary-tint text-ink"
                      : "border-line-strong bg-surface text-ink-muted hover:border-primary/40"
                  )}
                >
                  <span className="block font-semibold">{s.label}</span>
                  <span className="block text-xs text-ink-subtle">{s.type}.{s.version}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Holder address" error={errors.holder?.message}>
            <input
              className="input-mono"
              placeholder="0x…"
              disabled={isIssuing}
              {...form.register("holder", {
                required: "Holder address is required",
                validate: (v) => isAddress(v) || "Enter a valid Ethereum address",
              })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {schema.display.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Field label={f.label}>
                  {f.type === "textarea" ? (
                    <textarea
                      className="input min-h-[80px] resize-y"
                      placeholder={f.placeholder}
                      disabled={isIssuing}
                      {...form.register(`display.${f.key}` as const, { required: f.required })}
                    />
                  ) : (
                    <input
                      className="input"
                      placeholder={f.placeholder}
                      disabled={isIssuing}
                      {...form.register(`display.${f.key}` as const, { required: f.required })}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>

          {/* Provable claims (private) */}
          <div className="rounded-lg border border-line bg-sunken/40 p-4">
            <p className="mb-3 text-sm font-medium text-ink">
              Private claims{" "}
              <span className="font-normal text-ink-subtle">
                — committed on-chain, provable by threshold, never revealed
              </span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {schema.claims.map((f) => {
                const inputType =
                  f.kind === "timestamp" ? "date" : f.kind === "string" ? "text" : "number";
                const hint =
                  f.kind === "number" && f.min !== undefined
                    ? `${f.min}–${f.max}${f.unit ? ` ${f.unit}` : ""}`
                    : f.kind === "timestamp"
                    ? "expiry date"
                    : undefined;
                return (
                  <Field
                    key={f.key}
                    label={f.label}
                    hint={hint}
                    error={(errors.claims as any)?.[f.key]?.message}
                  >
                    <input
                      className="input"
                      type={inputType}
                      {...(f.kind === "number"
                        ? { min: f.min, max: f.max, step: f.step ?? "any" }
                        : {})}
                      disabled={isIssuing}
                      {...form.register(`claims.${f.key}` as const, {
                        required: `${f.label} is required`,
                        validate: (v) => {
                          if (f.kind !== "number") return true;
                          const n = parseFloat(v);
                          return (
                            (!isNaN(n) &&
                              n >= (f.min ?? -Infinity) &&
                              n <= (f.max ?? Infinity)) ||
                            `Must be between ${f.min} and ${f.max}`
                          );
                        },
                      })}
                    />
                  </Field>
                );
              })}
            </div>
          </div>

          <Field label="Certificate image" hint="PNG or JPEG, stored on IPFS">
            <input
              className="input file:mr-3 file:rounded file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
              type="file"
              accept="image/*"
              disabled={isIssuing}
              {...form.register("image", { required: true })}
            />
          </Field>

          <button className="btn-primary w-full" disabled={isIssuing}>
            <Stamp size={16} aria-hidden="true" />
            {isIssuing ? "Issuing…" : `Issue ${schema.label.toLowerCase()}`}
          </button>
        </form>

        {/* Membership */}
        <div className="space-y-6">
          <div className="panel-pad">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox size={17} className="text-primary" aria-hidden="true" />
                <h2 className="font-semibold text-ink">Pending requests</h2>
              </div>
              <button
                onClick={() => {
                  refetchMembers();
                  refreshRole();
                }}
                disabled={membersLoading}
                className="text-xs font-semibold text-primary transition hover:text-primary-hover disabled:opacity-50"
              >
                {membersLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {membersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (members?.pending.length ?? 0) === 0 ? (
              <EmptyState icon={<Inbox size={26} />} title="No pending requests">
                When a holder requests membership, they'll appear here for approval.
              </EmptyState>
            ) : (
              <ul className="space-y-2">
                {members?.pending.map((holder) => (
                  <li
                    key={holder}
                    className="flex flex-col gap-3 rounded-lg border border-line bg-sunken/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <DataChip value={holder} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDecision(holder, true)}
                        disabled={processing === holder}
                        className="btn-secondary flex-1 sm:flex-none"
                      >
                        <UserCheck size={15} aria-hidden="true" />
                        {processing === holder ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => onDecision(holder, false)}
                        disabled={processing === holder}
                        className="btn-ghost text-danger-ink hover:bg-danger-tint"
                      >
                        <UserX size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel-pad">
            <div className="mb-4 flex items-center gap-2">
              <Users size={17} className="text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-ink">Approved members</h2>
            </div>
            {(members?.approved.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-subtle">No approved members yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {members?.approved.map((member) => (
                  <li key={member}>
                    <DataChip value={member} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Issued certificates */}
      <div className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          Issued credentials
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
          <EmptyState icon={<FileText size={28} />} title="No credentials issued yet">
            Approve a holder above, then issue their first credential. It will be
            recorded on-chain with a zero-knowledge commitment.
          </EmptyState>
        )}
      </div>
    </section>
  );
};
