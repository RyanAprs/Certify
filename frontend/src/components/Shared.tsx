import { ReactNode, useEffect, useState } from "react";
import { Certificate } from "../types";
import { format } from "date-fns";
import { Copy, Download } from "lucide-react";
import toast from "react-hot-toast";
import { fetchJson, ipfsUrl } from "../lib/ipfs";

interface CertificateMetadata {
  name: string;
  institution: string;
  program: string;
  gpa?: string;
  description?: string;
  imageCid?: string;
  issuedAt?: string;
}

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard?.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Clipboard unavailable");
  }
}

/* ---------------- Reusable primitives ---------------- */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300" role="status">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "error" | "success";
  title?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "border-slate-700 bg-slate-900/60 text-slate-200",
    warning: "border-yellow-700 bg-yellow-900/20 text-yellow-100",
    error: "border-red-800 bg-red-900/20 text-red-100",
    success: "border-green-800 bg-green-900/20 text-green-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`} role="note">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Certificate["status"] }) {
  const map: Record<string, string> = {
    Active: "bg-green-500/15 text-green-300 border-green-500/30",
    Pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    Revoked: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

/* ---------------- Certificate card ---------------- */

export const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);
  const [metaError, setMetaError] = useState(false);
  const issued = Number(certificate.issuedAt) * 1000;

  useEffect(() => {
    let mounted = true;
    setMetaError(false);
    fetchJson<CertificateMetadata>(certificate.metadataCid)
      .then((data) => mounted && setMetadata(data))
      .catch(() => mounted && setMetaError(true));
    return () => {
      mounted = false;
    };
  }, [certificate.metadataCid]);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <header className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>#{certificate.id.toString()}</span>
        <StatusBadge status={certificate.status} />
      </header>

      {metadata?.imageCid && (
        <img
          src={ipfsUrl(metadata.imageCid)}
          alt={`Certificate for ${metadata.name}`}
          className="mt-4 h-40 w-full rounded-lg object-cover"
        />
      )}

      <div className="mt-3 space-y-2 text-sm">
        {metaError && (
          <p className="text-xs text-yellow-400">
            ⚠️ Metadata could not be loaded from IPFS.
          </p>
        )}
        {metadata && (
          <>
            <p className="text-lg font-semibold">{metadata.name}</p>
            <p className="text-slate-300">{metadata.institution}</p>
            <p className="text-slate-400">Program: {metadata.program}</p>
            {metadata.gpa && <p className="text-slate-400">GPA: {metadata.gpa}</p>}
            {metadata.description && (
              <p className="text-slate-400">{metadata.description}</p>
            )}
          </>
        )}

        <p className="text-slate-400">Issuer</p>
        <button
          type="button"
          aria-label="Copy issuer address"
          className="flex items-center gap-2 text-left text-white"
          onClick={() => copy(certificate.issuer, "Issuer address copied")}
        >
          <span className="break-all">{certificate.issuer}</span>
          <Copy size={16} aria-hidden="true" />
        </button>

        <p className="text-slate-400">Holder</p>
        <p className="break-all text-white">{certificate.holder}</p>

        <p className="text-slate-400">Metadata CID</p>
        <a
          className="flex items-center gap-2 text-primary"
          target="_blank"
          rel="noreferrer"
          href={ipfsUrl(certificate.metadataCid)}
        >
          <span className="break-all">{certificate.metadataCid}</span>
          <Download size={16} aria-hidden="true" />
        </a>

        <p className="text-slate-400">Issued At</p>
        <p>{issued ? format(issued, "PPpp") : metadata?.issuedAt ?? "-"}</p>
      </div>
    </article>
  );
};
