import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import clsx from "clsx";
import { Search, ShieldCheck, Cpu, FileCheck, History, CircleCheck } from "lucide-react";

import { useDisclosures } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import { publicClient, registryContract } from "../lib/contract";
import { fetchFromIpfs, ipfsUrl } from "../lib/ipfs";
import { DataChip, EmptyState, Field, Notice, PageHeader, Spinner, StatusBadge } from "./Shared";
import { CertificateStatus } from "../types";
import { getSchema, Schema } from "../lib/schemas";
import {
  generateRangeProof,
  verifyProof,
  formatProofForSolidity,
  validateZkFiles,
  CredentialMetadata,
  ZKProof,
} from "../lib/zkp";

interface Cert {
  id: bigint;
  issuer: string;
  holder: string;
  metadataCid: string;
  metadataCommitment: `0x${string}`;
  status: CertificateStatus;
  schemaId: string;
}

function toStatus(n: number): CertificateStatus {
  return n === 0 ? "Pending" : n === 1 ? "Active" : "Revoked";
}

export const VerifierDashboard = () => {
  const { isConnected } = useAccount();
  const { write } = useRegistryWrite();

  const [certificateId, setCertificateId] = useState("");
  const [cert, setCert] = useState<Cert | null>(null);
  const [metadata, setMetadata] = useState<CredentialMetadata | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [claimKey, setClaimKey] = useState<string>("");
  const [threshold, setThreshold] = useState("");
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [localVerified, setLocalVerified] = useState<boolean | null>(null);
  const [zkLoading, setZkLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [zkFilesOk, setZkFilesOk] = useState<boolean | null>(null);

  const schema: Schema | undefined = useMemo(
    () => (cert ? getSchema(cert.schemaId) : undefined),
    [cert]
  );
  const claimField = schema?.claims.find((f) => f.key === claimKey);

  const { data: disclosures } = useDisclosures(
    certificateId ? BigInt(certificateId) : undefined
  );

  useEffect(() => {
    validateZkFiles().then((s) => setZkFilesOk(s.wasm && s.zkey && s.vkey));
  }, []);

  const onSearch = async () => {
    if (!certificateId) return;
    setCert(null);
    setMetadata(null);
    setZkProof(null);
    setLocalVerified(null);
    setIsSearching(true);
    try {
      const data = (await publicClient.readContract({
        ...registryContract,
        functionName: "certificates",
        args: [BigInt(certificateId)],
      })) as readonly [bigint, string, string, string, `0x${string}`, number, bigint, `0x${string}`];
      if (data[1] === "0x0000000000000000000000000000000000000000") {
        throw new Error("Certificate not found");
      }
      const found: Cert = {
        id: data[0],
        issuer: data[1],
        holder: data[2],
        metadataCid: data[3],
        metadataCommitment: data[4],
        status: toStatus(Number(data[5])),
        schemaId: data[7],
      };
      setCert(found);
      const sc = getSchema(found.schemaId);
      setClaimKey(sc?.claims[0]?.key ?? "");
      setThreshold("");
      if (found.metadataCid) {
        try {
          setMetadata(await fetchFromIpfs<CredentialMetadata>(found.metadataCid));
        } catch {
          toast.error("Failed to load metadata from IPFS");
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Certificate not found");
    } finally {
      setIsSearching(false);
    }
  };

  const onGenerateProof = async () => {
    if (!metadata || !schema || !claimField) return toast.error("Load a certificate first");
    if (!metadata.salts) {
      return toast.error("This credential has no ZK salts (issued before the ZK upgrade).");
    }
    const t = parseFloat(threshold);
    if (isNaN(t)) return toast.error("Enter a threshold");
    setZkLoading(true);
    setLocalVerified(null);
    try {
      const proof = await generateRangeProof(schema, metadata, claimKey, t);
      setZkProof(proof);
      setLocalVerified(await verifyProof(proof));
      toast.success("Proof generated & self-verified");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate proof");
    } finally {
      setZkLoading(false);
    }
  };

  const onVerifyOnChain = async () => {
    if (!zkProof || !cert) return;
    setIsVerifying(true);
    try {
      const { a, b, c, pubSignals } = formatProofForSolidity(zkProof);
      await write("verifyRangeProof", [cert.id, a, b, c, pubSignals], {
        pending: "Verifying proof on-chain…",
        success: "Proof verified on-chain",
      });
    } catch {
      /* toast shown by useRegistryWrite */
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section>
      <PageHeader
        icon={<ShieldCheck size={22} aria-hidden="true" />}
        eyebrow="Workspace"
        title="Verifier"
        description="Look up a credential and verify a threshold on-chain — without seeing the underlying value."
      />

      {zkFilesOk === false && (
        <div className="mb-6">
          <Notice tone="warning" title="ZK artifacts not built">
            <code>range.wasm</code> / <code>range.zkey</code> are missing from{" "}
            <code>public/zk/</code>. Run <code>cd zk &amp;&amp; ./build.sh</code>{" "}
            before generating proofs.
          </Notice>
        </div>
      )}

      {/* Search */}
      <div className="panel-pad">
        <div className="mb-4 flex items-center gap-2">
          <Search size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-ink">Find a credential</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Certificate ID"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button className="btn-primary sm:w-36" onClick={onSearch} disabled={isSearching}>
            <Search size={16} aria-hidden="true" />
            {isSearching ? "Searching…" : "Search"}
          </button>
        </div>

        {cert && (
          <div className="mt-5 rounded-lg border border-line bg-sunken/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {metadata ? (
                  <>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="badge border-primary/25 bg-primary-tint text-primary">
                        {schema?.label ?? "Unknown type"}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-ink">{metadata.name}</h3>
                    <p className="text-sm text-ink-muted">
                      {metadata.program} · {metadata.institution}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-muted">
                    Certificate №{cert.id.toString().padStart(4, "0")}
                  </p>
                )}
              </div>
              <StatusBadge status={cert.status} />
            </div>
            <dl className="mt-4 flex flex-wrap gap-2">
              <DataChip label="issuer" value={cert.issuer} />
              <DataChip label="holder" value={cert.holder} />
              <DataChip label="cid" value={cert.metadataCid} href={ipfsUrl(cert.metadataCid)} />
            </dl>
          </div>
        )}
      </div>

      {/* Presentation request */}
      {metadata && schema && (
        <div className="panel-pad mt-6 space-y-5">
          <div className="flex items-center gap-2">
            <Cpu size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">Request a proof</h2>
          </div>

          {schema.claims.length > 1 && (
            <div>
              <span className="label">Claim to prove</span>
              <div className="flex flex-wrap gap-2">
                {schema.claims.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setClaimKey(f.key);
                      setThreshold("");
                      setZkProof(null);
                    }}
                    className={clsx(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                      f.key === claimKey
                        ? "border-primary bg-primary-tint text-ink"
                        : "border-line-strong text-ink-muted hover:border-primary/40"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field
              label={`Minimum ${claimField?.label ?? "value"} to prove`}
              hint={
                claimField
                  ? `Proves ${claimField.label} ≥ threshold (range ${claimField.min}–${claimField.max}), value stays hidden`
                  : undefined
              }
            >
              <input
                className="input"
                type="number"
                min={claimField?.min}
                max={claimField?.max}
                step={claimField?.step ?? "any"}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={claimField ? String(claimField.min) : ""}
              />
            </Field>
            <button
              className="btn-secondary"
              onClick={onGenerateProof}
              disabled={zkLoading || zkFilesOk === false}
            >
              <Cpu size={16} aria-hidden="true" />
              {zkLoading ? "Generating…" : "Generate proof"}
            </button>
          </div>

          {zkLoading && <Spinner label="Computing zero-knowledge proof…" />}

          {zkProof && (
            <div className="space-y-4 rounded-lg border border-valid/25 bg-valid-tint p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <CircleCheck size={16} className="text-valid-ink" aria-hidden="true" />
                Proof generated
                {localVerified !== null && (
                  <span className="text-ink-muted">
                    · self-verify {localVerified ? "passed" : "failed"}
                  </span>
                )}
              </div>
              <button
                className="btn-primary w-full"
                onClick={onVerifyOnChain}
                disabled={isVerifying || !isConnected}
              >
                <FileCheck size={16} aria-hidden="true" />
                {isVerifying ? "Verifying…" : "Verify on-chain"}
              </button>
              {!isConnected && (
                <p className="text-xs text-pending-ink">
                  Connect a wallet to submit the on-chain verification.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disclosures */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <History size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-serif text-xl font-semibold text-ink">Disclosure history</h2>
        </div>
        {disclosures && disclosures.length > 0 ? (
          <ul className="space-y-3">
            {disclosures.map((d: any, idx: number) => (
              <li
                key={`${d.verifier}-${d.timestamp.toString()}-${idx}`}
                className="panel space-y-2 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <DataChip label="verifier" value={d.verifier} />
                  {d.encryptedPayloadCid && (
                    <DataChip label="payload" value={d.encryptedPayloadCid} href={ipfsUrl(d.encryptedPayloadCid)} />
                  )}
                </div>
                <p className="font-mono text-[0.7rem] text-ink-subtle">
                  {new Date(Number(d.timestamp) * 1000).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<History size={26} />} title="No disclosures yet">
            Search a certificate above to see who it has been shared with.
          </EmptyState>
        )}
      </div>
    </section>
  );
};
