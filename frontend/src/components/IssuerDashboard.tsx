import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isAddress, parseAbiItem } from "viem";
import toast from "react-hot-toast";
import { useState } from "react";
import { Stamp, UserCheck, UserX, Users, Inbox, FileText, ShieldPlus, X } from "lucide-react";

import { useIssuerCertificates } from "@/hooks/useCertificates";
import { useRegistryWrite } from "@/hooks/useRegistryWrite";
import { useMemberRequests } from "@/hooks/useMemberRequests";
import { useRole } from "@/context/RoleContext";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  CertificateCard,
  DataChip,
  EmptyState,
  Field,
  PageHeader,
  Skeleton,
  SkeletonCard,
} from "@/components/Shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile, uploadJson } from "@/lib/ipfs";
import { publicClient, registryContract, deploymentBlock } from "@/lib/contract";
import { SCHEMAS, Schema } from "@/lib/schemas";
import { CredentialMetadata, buildCommitment } from "@/lib/zkp";

type IssueForm = {
  holder: string;
  display: Record<string, string>;
  claims: Record<string, string>;
  image: FileList;
};

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
  const { t, tt } = useT();
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
        pending: t("op.removing"),
        success: t("op.removed"),
      });
      await refetchIssuers();
    } catch {
      /* toast shown */
    } finally {
      setRemovingIssuer(null);
    }
  };

  const onRegisterIssuer = async () => {
    if (!isAddress(issuerAddr)) return toast.error(t("valid.addr"));
    setRegistering(true);
    try {
      await write("registerIssuer", [issuerAddr as `0x${string}`], {
        pending: t("op.registering"),
        success: t("op.registered"),
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
        pending: approve ? t("op.approving") : t("op.rejecting"),
        success: approve ? t("op.memberApproved") : t("op.memberRejected"),
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
      if (!file) throw new Error(t("valid.imgReq"));

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
        loading: t("op.uploadingImg"),
        success: t("op.imgUploaded"),
        error: t("op.imgFailed"),
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
        { pending: t("op.issuing"), success: t("op.issued") }
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
        eyebrow={t("workspace")}
        title={t("nav.issuer")}
        description={t("issuer.desc")}
        aside={address ? <DataChip label={t("signedIn")} value={address} /> : undefined}
      />

      {isAdmin && (
        <Card className="mb-6 border-primary/30 bg-primary-tint/40 p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2">
            <ShieldPlus size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">{t("admin.title")}</h2>
          </div>
          <p className="mb-4 text-sm text-ink-muted">{t("admin.desc")}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              className="flex-1 font-mono text-[0.8125rem] tracking-tight"
              placeholder={t("admin.placeholder")}
              value={issuerAddr}
              onChange={(e) => setIssuerAddr(e.target.value)}
            />
            <Button
              variant="secondary"
              className="sm:w-48"
              onClick={onRegisterIssuer}
              disabled={registering}
            >
              <ShieldPlus size={16} aria-hidden="true" />
              {registering ? t("admin.registering") : t("admin.register")}
            </Button>
          </div>
          {issuers && issuers.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-ink-subtle">
                {t("admin.registered")}
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
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Issue */}
        <Card asChild>
          <form onSubmit={onIssue} className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <FileText size={17} className="text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-ink">{t("issue.title")}</h2>
            </div>

            {/* Credential type */}
            <div>
              <span className="mb-1.5 block text-[0.8125rem] font-medium text-ink-muted">
                {t("issue.type")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SCHEMAS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSchema(s);
                      form.resetField("claims");
                    }}
                    aria-pressed={s.id === schema.id}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-sm transition",
                      s.id === schema.id
                        ? "border-primary bg-primary-tint text-ink"
                        : "border-line-strong bg-surface text-ink-muted hover:border-primary/40"
                    )}
                  >
                    <span className="block font-semibold">{tt(`schema.${s.type}`, s.label)}</span>
                    <span className="block text-xs text-ink-subtle">
                      {s.type}.{s.version}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Field label={t("issue.holder")} error={errors.holder?.message}>
              <Input
                className="font-mono text-[0.8125rem] tracking-tight"
                placeholder="0x…"
                disabled={isIssuing}
                {...form.register("holder", {
                  required: t("valid.holderReq"),
                  validate: (v) => isAddress(v) || t("valid.addr"),
                })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              {schema.display.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Field label={tt(`field.${f.key}`, f.label)}>
                    {f.type === "textarea" ? (
                      <Textarea
                        placeholder={f.placeholder}
                        disabled={isIssuing}
                        {...form.register(`display.${f.key}` as const, { required: f.required })}
                      />
                    ) : (
                      <Input
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
                {t("issue.claimsTitle")}{" "}
                <span className="font-normal text-ink-subtle">{t("hint.claims")}</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {schema.claims.map((f) => {
                  const inputType =
                    f.kind === "timestamp" ? "date" : f.kind === "string" ? "text" : "number";
                  const hint =
                    f.kind === "number" && f.min !== undefined
                      ? `${f.min}–${f.max}${f.unit ? ` ${f.unit}` : ""}`
                      : f.kind === "timestamp"
                      ? t("issue.expiryHint")
                      : undefined;
                  return (
                    <Field
                      key={f.key}
                      label={tt(`field.${f.key}`, f.label)}
                      hint={hint}
                      error={(errors.claims as any)?.[f.key]?.message}
                    >
                      <Input
                        type={inputType}
                        {...(f.kind === "number"
                          ? { min: f.min, max: f.max, step: f.step ?? "any" }
                          : {})}
                        disabled={isIssuing}
                        {...form.register(`claims.${f.key}` as const, {
                          required: t("valid.fieldReq", { label: tt(`field.${f.key}`, f.label) }),
                          validate: (v) => {
                            if (f.kind !== "number") return true;
                            const n = parseFloat(v);
                            return (
                              (!isNaN(n) &&
                                n >= (f.min ?? -Infinity) &&
                                n <= (f.max ?? Infinity)) ||
                              t("valid.range", { min: f.min ?? "", max: f.max ?? "" })
                            );
                          },
                        })}
                      />
                    </Field>
                  );
                })}
              </div>
            </div>

            <Field label={t("issue.image")} hint={t("hint.imgTypes")}>
              <Input type="file" accept="image/*" disabled={isIssuing} {...form.register("image", { required: true })} />
            </Field>

            <Button type="submit" className="w-full" disabled={isIssuing}>
              <Stamp size={16} aria-hidden="true" />
              {isIssuing
                ? t("issue.submitting")
                : t("issue.submit", { type: tt(`schema.${schema.type}`, schema.label).toLowerCase() })}
            </Button>
          </form>
        </Card>

        {/* Membership */}
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox size={17} className="text-primary" aria-hidden="true" />
                <h2 className="font-semibold text-ink">{t("pending.title")}</h2>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  refetchMembers();
                  refreshRole();
                }}
                disabled={membersLoading}
                className="h-auto p-0 text-xs"
              >
                {membersLoading ? t("common.refreshing") : t("common.refresh")}
              </Button>
            </div>

            {membersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (members?.pending.length ?? 0) === 0 ? (
              <EmptyState icon={<Inbox size={26} />} title={t("pending.empty")}>
                {t("pending.emptyBody")}
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDecision(holder, true)}
                        disabled={processing === holder}
                        className="flex-1 sm:flex-none"
                      >
                        <UserCheck size={15} aria-hidden="true" />
                        {processing === holder ? "…" : t("approve")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDecision(holder, false)}
                        disabled={processing === holder}
                        className="text-danger-ink hover:bg-danger-tint"
                        aria-label={t("op.rejecting")}
                      >
                        <UserX size={15} aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users size={17} className="text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-ink">{t("members.title")}</h2>
            </div>
            {(members?.approved.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-subtle">{t("members.empty")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {members?.approved.map((member) => (
                  <li key={member}>
                    <DataChip value={member} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Issued certificates */}
      <div className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          {t("issued.title")}
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
          <EmptyState icon={<FileText size={28} />} title={t("issued.empty")}>
            {t("issued.emptyBody")}
          </EmptyState>
        )}
      </div>
    </section>
  );
};
