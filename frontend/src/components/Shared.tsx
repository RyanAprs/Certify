import { useEffect, useState } from "react";
import { Certificate } from "../types";
import { format } from "date-fns";
import { Copy, Download } from "lucide-react";
import { fetchJson } from "../lib/ipfs";

interface CertificateMetadata {
  name: string;
  institution: string;
  program: string;
  gpa?: string;
  description?: string;
  imageCid?: string;
  issuedAt?: string;
}

export const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);
  const issued = Number(certificate.issuedAt) * 1000;

  useEffect(() => {
    let mounted = true;
    fetchJson<CertificateMetadata>(certificate.metadataCid)
      .then((data) => mounted && setMetadata(data))
      .catch(() => setMetadata(null));
    return () => {
      mounted = false;
    };
  }, [certificate.metadataCid]);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <header className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>#{certificate.id.toString()}</span>
        <span>{certificate.status}</span>
      </header>
      {metadata?.imageCid && (
        <img
          src={`https://ipfs.io/ipfs/${metadata.imageCid}`}
          alt={metadata.name}
          className="mt-4 h-40 w-full rounded-lg object-cover"
        />
      )}
      <div className="mt-3 space-y-2 text-sm">
        {metadata && (
          <>
            <p className="text-lg font-semibold">{metadata.name}</p>
            <p className="text-slate-300">{metadata.institution}</p>
            <p className="text-slate-400">Program: {metadata.program}</p>
            {metadata.gpa && <p className="text-slate-400">GPA: {metadata.gpa}</p>}
            {metadata.description && <p className="text-slate-400">{metadata.description}</p>}
          </>
        )}
        <p className="text-slate-400">Issuer</p>
        <button className="flex items-center gap-2 text-left text-white" onClick={() => navigator.clipboard.writeText(certificate.issuer)}>
          {certificate.issuer}
          <Copy size={16} />
        </button>
        <p className="text-slate-400">Holder</p>
        <p className="text-white">{certificate.holder}</p>
        <p className="text-slate-400">Metadata CID</p>
        <a className="flex items-center gap-2 text-primary" target="_blank" rel="noreferrer" href={`https://ipfs.io/ipfs/${certificate.metadataCid}`}>
          {certificate.metadataCid}
          <Download size={16} />
        </a>
        <p className="text-slate-400">Issued At</p>
        <p>{issued ? format(issued, "PPpp") : metadata?.issuedAt ?? "-"}</p>
      </div>
    </article>
  );
};
