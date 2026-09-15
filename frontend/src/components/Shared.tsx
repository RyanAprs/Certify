import { ReactNode, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Copy,
  Check,
  ExternalLink,
  BadgeCheck,
  Clock,
  Ban,
  Info,
  TriangleAlert,
  CircleCheck,
  FileWarning,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Certificate, CertificateStatus } from "@/types";
import { fetchJson, ipfsUrl } from "@/lib/ipfs";
import { getSchema } from "@/lib/schemas";
import { useRole } from "@/context/RoleContext";
import { useRegistryWrite } from "@/hooks/useRegistryWrite";
import { useT } from "@/lib/i18n";

/* ---------------- helpers ---------------- */

export function truncateMiddle(value: string, head = 6, tail = 4) {
  if (!value || value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

async function copyText(text: string, label = "Copied to clipboard") {
  try {
    await navigator.clipboard?.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Clipboard unavailable");
  }
}

/* ---------------- primitives ---------------- */

export { Skeleton };

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink-muted", className)} role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-primary"
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  );
}

export function SkeletonCard() {
  return (
    <Card className="space-y-4 p-5 sm:p-6" aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-6 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <Skeleton className="h-9 w-full" />
    </Card>
  );
}

const NOTICE_ICON = {
  info: Info,
  warning: TriangleAlert,
  danger: FileWarning,
  success: CircleCheck,
} as const;

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof NOTICE_ICON;
  title?: string;
  children: ReactNode;
}) {
  const Icon = NOTICE_ICON[tone];
  return (
    <Alert tone={tone}>
      <Icon aria-hidden="true" />
      <div className="min-w-0">
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </div>
    </Alert>
  );
}

const STATUS_TONE: Record<CertificateStatus, { tone: "valid" | "pending" | "danger"; Icon: typeof BadgeCheck }> = {
  Active: { tone: "valid", Icon: BadgeCheck },
  Pending: { tone: "pending", Icon: Clock },
  Revoked: { tone: "danger", Icon: Ban },
};

export function StatusBadge({ status }: { status: CertificateStatus }) {
  const { t } = useT();
  const { tone, Icon } = STATUS_TONE[status];
  return (
    <Badge tone={tone}>
      <Icon size={13} aria-hidden="true" />
      {t(`status.${status}`)}
    </Badge>
  );
}

/** Mono data chip for on-chain values, with copy + optional IPFS link. */
export function DataChip({
  value,
  label,
  href,
  truncate = true,
}: {
  value: string;
  label?: string;
  href?: string;
  truncate?: boolean;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 font-mono text-[0.75rem] text-ink-muted">
      {label && <span className="text-ink-subtle">{label}</span>}
      <span className="truncate">{truncate ? truncateMiddle(value, 8, 6) : value}</span>
      <button
        type="button"
        onClick={() => copyText(value)}
        aria-label={`Copy ${label ?? "value"}`}
        className="opacity-60 transition hover:opacity-100"
      >
        <Copy size={12} aria-hidden="true" />
      </button>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="Open on IPFS"
          className="opacity-60 transition hover:opacity-100"
        >
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      )}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong bg-sunken/50 px-6 py-10 text-center">
      <div className="mb-1 text-ink-subtle" aria-hidden="true">
        {icon}
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {children && <p className="max-w-sm text-sm text-ink-muted">{children}</p>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger-ink">
          <TriangleAlert size={12} aria-hidden="true" /> {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>
      )}
    </div>
  );
}

/** Per-role page identity header. Keeps each role on its own distinct page. */
export function PageHeader({
  icon,
  eyebrow,
  title,
  description,
  aside,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-primary shadow-xs"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
            {eyebrow}
          </p>
          <h1 className="text-balance font-serif text-2xl font-semibold leading-tight text-ink sm:text-[1.75rem]">
            {title}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}

/* ---------------- Certificate artifact ---------------- */

interface CertificateMetadata {
  name: string;
  institution: string;
  program: string;
  type?: string;
  claims?: Record<string, number | string>;
  description?: string;
  imageCid?: string;
  issuedAt?: string;
}

export const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [copied, setCopied] = useState(false);
  const issued = Number(certificate.issuedAt) * 1000;
  const schema = getSchema(certificate.schemaId);

  const { address } = useAccount();
  const { isAdmin } = useRole();
  const { write } = useRegistryWrite();
  const { t, tt } = useT();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const canManage =
    !!address &&
    (address.toLowerCase() === certificate.issuer.toLowerCase() || isAdmin);

  async function changeStatus(
    status: number,
    msg: { pending: string; success: string }
  ) {
    setBusy(true);
    try {
      await write("setCertificateStatus", [certificate.id, status], msg);
      queryClient.invalidateQueries({ queryKey: ["issuerCertificates"] });
      queryClient.invalidateQueries({ queryKey: ["holderCertificates"] });
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    setState("loading");
    fetchJson<CertificateMetadata>(certificate.metadataCid)
      .then((data) => {
        if (mounted) {
          setMetadata(data);
          setState("ok");
        }
      })
      .catch(() => mounted && setState("error"));
    return () => {
      mounted = false;
    };
  }, [certificate.metadataCid]);

  const verified = certificate.status === "Active";

  return (
    <Card className="group overflow-hidden transition-shadow duration-200 hover:shadow-md">
      {/* Ruled masthead — a document header, not an eyebrow kicker */}
      <div className="flex items-center justify-between border-b border-line bg-sunken/60 px-5 py-3">
        <span className="font-mono text-xs text-ink-subtle">
          №{certificate.id.toString().padStart(4, "0")}
          {schema ? ` · ${schema.label}` : ""}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={certificate.status} />
          {canManage && certificate.status === "Active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                changeStatus(2, { pending: t("op.revoking"), success: t("op.revoked") })
              }
              disabled={busy}
              className="border-danger/30 py-0.5 text-danger-ink hover:bg-danger-tint"
            >
              {t("revoke")}
            </Button>
          )}
          {canManage && certificate.status === "Revoked" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                changeStatus(1, { pending: t("op.reactivating"), success: t("op.reactivated") })
              }
              disabled={busy}
              className="border-valid/30 py-0.5 text-valid-ink hover:bg-valid-tint"
            >
              {t("reactivate")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-3">
          {state === "loading" ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : state === "error" ? (
            <p className="text-sm text-pending-ink">{t("card.metaError")}</p>
          ) : (
            metadata && (
              <>
                <div>
                  <h3 className="text-balance font-serif text-2xl font-semibold leading-tight text-ink">
                    {metadata.name}
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {metadata.program} · {metadata.institution}
                  </p>
                </div>
                {schema && metadata.claims && (
                  <div className="flex flex-wrap gap-2">
                    {schema.claims.map((f) =>
                      metadata.claims?.[f.key] !== undefined ? (
                        <div
                          key={f.key}
                          className="inline-flex items-baseline gap-1.5 rounded-md bg-sunken px-2.5 py-1"
                        >
                          <span className="text-xs text-ink-subtle">{tt(`field.${f.key}`, f.label)}</span>
                          <span className="font-mono text-sm font-semibold text-ink">
                            {f.kind === "timestamp"
                              ? format(Number(metadata.claims[f.key]) * 1000, "d MMM yyyy")
                              : `${metadata.claims[f.key]}${f.unit ?? ""}`}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
                {metadata.description && (
                  <p className="max-w-prose text-pretty text-sm leading-relaxed text-ink-muted">
                    {metadata.description}
                  </p>
                )}
              </>
            )
          )}

          <dl className="flex flex-wrap gap-2 pt-1">
            <DataChip label="issuer" value={certificate.issuer} />
            <DataChip label="holder" value={certificate.holder} />
            <DataChip label="cid" value={certificate.metadataCid} href={ipfsUrl(certificate.metadataCid)} />
          </dl>

          <p className="pt-1 text-xs text-ink-subtle">
            {t("card.issued", { date: issued ? format(issued, "d MMM yyyy") : metadata?.issuedAt ?? "—" })}
          </p>
        </div>

        {/* Seal / artifact image */}
        <div className="flex shrink-0 items-start justify-end">
          {metadata?.imageCid ? (
            <img
              src={ipfsUrl(metadata.imageCid)}
              alt={`Credential artwork for ${metadata.name}`}
              className="h-24 w-24 rounded-lg border border-line object-cover sm:h-28 sm:w-28"
            />
          ) : (
            <div
              className={cn(
                "flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 sm:h-28 sm:w-28",
                verified ? "border-valid/40 text-valid-ink" : "border-line-strong text-ink-subtle"
              )}
              aria-hidden="true"
            >
              <BadgeCheck size={26} strokeWidth={1.75} />
              <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider">
                {verified ? t("card.verified") : t(`status.${certificate.status}`)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Copy the full commitment (data-dense footer affordance) */}
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(certificate.metadataCommitment);
          setCopied(true);
          toast.success(t("op.commitmentCopied"));
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex w-full items-center justify-between border-t border-line px-5 py-2.5 text-left font-mono text-[0.7rem] text-ink-subtle transition hover:bg-sunken/60"
        aria-label="Copy metadata commitment"
      >
        <span className="truncate">commitment {truncateMiddle(certificate.metadataCommitment, 10, 8)}</span>
        {copied ? <Check size={13} className="text-valid-ink" /> : <Copy size={13} aria-hidden="true" />}
      </button>
    </Card>
  );
};
