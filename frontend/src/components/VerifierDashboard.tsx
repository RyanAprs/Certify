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
import { getSchema, Schema, Predicate } from "../lib/schemas";
import {
  generateRangeProof,
  generateEqualityProof,
  generateMembershipProof,
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

const PREDICATE_LABEL: Record<Predicate, string> = {
  range: "Threshold ≥",
  equality: "Equals",
  membership: "One of",
};

export const VerifierDashboard = () => {
  const { isConnected } = useAccount();
  const { write } = useRegistryWrite();

  const [certificateId, setCertificateId] = useState("");
  const [cert, setCert] = useState<Cert | null>(null);
  const [metadata, setMetadata] = useState<CredentialMetadata | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [claimKey, setClaimKey] = useState<string>("");
  const [predicate, setPredicate] = useState<Predicate>("range");
  const [threshold, setThreshold] = useState("");
  const [eqValue, setEqValue] = useState("");
  const [setValues, setSetValues] = useState("");

  const [zkProof, setZkProof] = useState<{ proof: ZKProof; predicate: Predicate } | null>(null);
  const [localVerified, setLocalVerified] = useState<boolean | null>(null);
  const [zkLoading, setZkLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [zkFilesOk, setZkFilesOk] = useState<boolean | null>(null);

  const schema: Schema | undefined = useMemo(
    () => (cert ? getSchema(cert.schemaId) : undefined),
    [cert]
  );
  const claimField = schema?.claims.find((f) => f.key === claimKey);
  const isExpiry = claimField?.kind === "timestamp" && predicate === "range";

  const { data: disclosures } = useDisclosures(
    certificateId ? BigInt(certificateId) : undefined
  );

  useEffect(() => {
    validateZkFiles().then((s) => setZkFilesOk(s.wasm && s.zkey && s.vkey));
  }, []);

  function selectClaim(key: string) {
    setClaimKey(key);
    setZkProof(null);
    setThreshold("");
    setEqValue("");
    setSetValues("");
    const f = schema?.claims.find((c) => c.key === key);
    setPredicate(f?.predicates[0] ?? "range");
  }

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
      const firstClaim = sc?.claims[0];
      setClaimKey(firstClaim?.key ?? "");
      setPredicate(firstClaim?.predicates[0] ?? "range");
      setThreshold("");
      setEqValue("");
      setSetValues("");
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
    setZkLoading(true);
    setLocalVerified(null);
    try {
      let proof: ZKProof;
      if (predicate === "membership") {
        const list = setValues
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((v) => (claimField.kind === "number" ? parseFloat(v) : v));
        if (list.length === 0) throw new Error("Enter allowed values (comma-separated)");
        proof = await generateMembershipProof(schema, metadata, claimKey, list);
      } else if (predicate === "equality") {
        const v = claimField.kind === "number" ? parseFloat(eqValue) : eqValue;
        if (v === "" || (typeof v === "number" && isNaN(v))) throw new Error("Enter a value to match");
        proof = await generateEqualityProof(schema, metadata, claimKey, v);
      } else {
        const t = isExpiry ? Math.floor(Date.now() / 1000) : parseFloat(threshold);
        if (isNaN(t)) throw new Error("Enter a threshold");
        proof = await generateRangeProof(schema, metadata, claimKey, t);
      }
      setZkProof({ proof, predicate });
      setLocalVerified(await verifyProof(proof, predicate));
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
      const { a, b, c, pubSignals } = formatProofForSolidity(zkProof.proof);
      const fn =
        zkProof.predicate === "equality"
          ? "verifyEqualityProof"
          : zkProof.predicate === "membership"
          ? "verifyMembershipProof"
          : "verifyRangeProof";
      await write(fn, [cert.id, a, b, c, pubSignals], {
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
        description="Look up a credential and verify a claim on-chain — without seeing the underlying value."
      />

      {zkFilesOk === false && (
        <div className="mb-6">
          <Notice tone="warning" title="ZK artifacts not built">
            <code>range.*</code> / <code>equality.*</code> are missing from{" "}
            <code>public/zk/</code>. Run <code>cd zk &amp;&amp; ./build.sh</code> before generating proofs.
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
                    <div className="mb-1">
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
      {metadata && schema && claimField && (
        <div className="panel-pad mt-6 space-y-5">
          <div className="flex items-center gap-2">
            <Cpu size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-ink">Request a proof</h2>
          </div>

          {/* Claim */}
          {schema.claims.length > 1 && (
            <div>
              <span className="label">Claim</span>
              <div className="flex flex-wrap gap-2">
                {schema.claims.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => selectClaim(f.key)}
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

          {/* Predicate */}
          {claimField.predicates.length > 1 && (
            <div>
              <span className="label">Statement</span>
              <div className="flex flex-wrap gap-2">
                {claimField.predicates.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPredicate(p);
                      setZkProof(null);
                    }}
                    className={clsx(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                      p === predicate
                        ? "border-primary bg-primary-tint text-ink"
                        : "border-line-strong text-ink-muted hover:border-primary/40"
                    )}
                  >
                    {PREDICATE_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            {isExpiry ? (
              <p className="text-sm text-ink-muted">
                Proves <strong>{claimField.label}</strong> ≥ now — i.e. the credential is not expired.
              </p>
            ) : predicate === "membership" ? (
              <Field
                label={`${claimField.label} is one of`}
                hint="Comma-separated (max 8) — which one matched stays hidden"
              >
                <input
                  className="input"
                  type="text"
                  value={setValues}
                  onChange={(e) => setSetValues(e.target.value)}
                  placeholder={claimField.kind === "string" ? "e.g. BNSP, LSP, KAN" : "e.g. 3, 4, 5"}
                />
              </Field>
            ) : predicate === "equality" ? (
              <Field label={`${claimField.label} equals`} hint="Revealed to the verifier; other claims stay hidden">
                <input
                  className="input"
                  type={claimField.kind === "number" ? "number" : "text"}
                  value={eqValue}
                  onChange={(e) => setEqValue(e.target.value)}
                  placeholder={claimField.kind === "string" ? "e.g. BNSP" : "value"}
                />
              </Field>
            ) : (
              <Field
                label={`Minimum ${claimField.label}`}
                hint={
                  claimField.min !== undefined
                    ? `Proves ${claimField.label} ≥ threshold (range ${claimField.min}–${claimField.max})`
                    : "Value stays hidden"
                }
              >
                <input
                  className="input"
                  type="number"
                  min={claimField.min}
                  max={claimField.max}
                  step={claimField.step ?? "any"}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </Field>
            )}
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
