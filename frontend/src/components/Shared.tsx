import { ReactNode, useEffect, useState } from "react";
import clsx from "clsx";
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
import { Certificate, CertificateStatus } from "../types";
import { fetchJson, ipfsUrl } from "../lib/ipfs";
import { getSchema } from "../lib/schemas";

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

export function Spinner({ label, className }: { label?: string; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2 text-ink-muted", className)} role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-primary"
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="panel-pad space-y-4" aria-hidden="true">
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
    </div>
  );
}

const NOTICE = {
  info: { cls: "border-primary/25 bg-primary-tint", Icon: Info, iconCls: "text-primary" },
  warning: { cls: "border-pending/40 bg-pending-tint", Icon: TriangleAlert, iconCls: "text-pending-ink" },
  danger: { cls: "border-danger/35 bg-danger-tint", Icon: FileWarning, iconCls: "text-danger-ink" },
  success: { cls: "border-valid/35 bg-valid-tint", Icon: CircleCheck, iconCls: "text-valid-ink" },
} as const;

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof NOTICE;
  title?: string;
  children: ReactNode;
}) {
  const { cls, Icon, iconCls } = NOTICE[tone];
  return (
    <div className={clsx("flex gap-3 rounded-xl border p-4", cls)} role="note">
      <Icon size={18} className={clsx("mt-0.5 shrink-0", iconCls)} aria-hidden="true" />
      <div className="min-w-0 text-sm leading-relaxed text-ink">
        {title && <p className="mb-0.5 font-semibold">{title}</p>}
        <div className="text-ink-muted [&_code]:rounded [&_code]:bg-sunken [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8em] [&_code]:text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}

const STATUS: Record<CertificateStatus, { cls: string; Icon: typeof BadgeCheck; label: string }> = {
  Active: { cls: "border-valid/30 bg-valid-tint text-valid-ink", Icon: BadgeCheck, label: "Active" },
  Pending: { cls: "border-pending/40 bg-pending-tint text-pending-ink", Icon: Clock, label: "Pending" },
  Revoked: { cls: "border-danger/30 bg-danger-tint text-danger-ink", Icon: Ban, label: "Revoked" },
};

export function StatusBadge({ status }: { status: CertificateStatus }) {
  const { cls, Icon, label } = STATUS[status];
  return (
    <span className={clsx("badge", cls)}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
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
    <span className="chip-mono">
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
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
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
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-primary shadow-xs" aria-hidden="true">
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
  claims?: Record<string, number>;
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
    <article className="group overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Ruled masthead — a document header, not an eyebrow kicker */}
      <div className="flex items-center justify-between border-b border-line bg-sunken/60 px-5 py-3">
        <span className="font-mono text-xs text-ink-subtle">
          №{certificate.id.toString().padStart(4, "0")}
          {schema ? ` · ${schema.label}` : ""}
        </span>
        <StatusBadge status={certificate.status} />
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-3">
          {state === "loading" ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : state === "error" ? (
            <p className="text-sm text-pending-ink">Metadata could not be loaded from IPFS.</p>
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
                          <span className="text-xs text-ink-subtle">{f.label}</span>
                          <span className="font-mono text-sm font-semibold text-ink">
                            {metadata.claims[f.key]}
                            {f.unit ?? ""}
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
            Issued {issued ? format(issued, "d MMM yyyy") : metadata?.issuedAt ?? "—"}
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
              className={clsx(
                "flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 sm:h-28 sm:w-28",
                verified ? "border-valid/40 text-valid-ink" : "border-line-strong text-ink-subtle"
              )}
              aria-hidden="true"
            >
              <BadgeCheck size={26} strokeWidth={1.75} />
              <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider">
                {verified ? "Verified" : certificate.status}
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
          toast.success("Commitment copied");
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex w-full items-center justify-between border-t border-line px-5 py-2.5 text-left font-mono text-[0.7rem] text-ink-subtle transition hover:bg-sunken/60"
        aria-label="Copy metadata commitment"
      >
        <span className="truncate">commitment {truncateMiddle(certificate.metadataCommitment, 10, 8)}</span>
        {copied ? <Check size={13} className="text-valid-ink" /> : <Copy size={13} aria-hidden="true" />}
      </button>
    </article>
  );
};
