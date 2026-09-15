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
import { useT } from "../lib/i18n";
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

export const VerifierDashboard = () => {
  const { isConnected } = useAccount();
  const { write } = useRegistryWrite();
  const { t, tt } = useT();

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

  // Robust parse: strip anything non-numeric (e.g. a pasted "№0001") so an
  // invalid input never throws inside BigInt() during render.
  const certId = useMemo(() => {
    const digits = certificateId.replace(/[^0-9]/g, "");
    return digits ? BigInt(digits) : undefined;
  }, [certificateId]);

  const { data: disclosures } = useDisclosures(certId);

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
    if (certId === undefined) return;
    setCert(null);
    setMetadata(null);
    setZkProof(null);
    setLocalVerified(null);
    setIsSearching(true);
    try {
      const data = (await publicClient.readContract({
        ...registryContract,
        functionName: "certificates",
        args: [certId],
      })) as readonly [bigint, string, string, string, `0x${string}`, number, bigint, `0x${string}`];
      if (data[1] === "0x0000000000000000000000000000000000000000") {
        throw new Error(t("err.notFound"));
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
          toast.error(t("err.metaFail"));
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? t("err.notFound"));
    } finally {
      setIsSearching(false);
    }
  };

  const onGenerateProof = async () => {
    if (!metadata || !schema || !claimField) return toast.error(t("err.loadCert"));
    if (!metadata.salts) {
      return toast.error(t("err.noSalts"));
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
        if (list.length === 0) throw new Error(t("err.enterSet"));
        proof = await generateMembershipProof(schema, metadata, claimKey, list);
      } else if (predicate === "equality") {
        const v = claimField.kind === "number" ? parseFloat(eqValue) : eqValue;
        if (v === "" || (typeof v === "number" && isNaN(v))) throw new Error(t("err.enterValue"));
        proof = await generateEqualityProof(schema, metadata, claimKey, v);
      } else {
        const thr = isExpiry ? Math.floor(Date.now() / 1000) : parseFloat(threshold);
        if (isNaN(thr)) throw new Error(t("err.enterThreshold"));
        proof = await generateRangeProof(schema, metadata, claimKey, thr);
      }
      setZkProof({ proof, predicate });
      setLocalVerified(await verifyProof(proof, predicate));
      toast.success(t("op.proofDone"));
    } catch (err: any) {
      toast.error(err?.message ?? t("err.proofFail"));
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
        pending: t("op.verifyingChain"),
        success: t("op.verifiedChain"),
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
        eyebrow={t("workspace")}
        title={t("nav.verifier")}
        description={t("verifier.desc")}
      />

      {zkFilesOk === false && (
        <div className="mb-6">
          <Notice tone="warning" title={t("zk.missing.title")}>
            <code>range.*</code> / <code>equality.*</code> are missing from{" "}
            <code>public/zk/</code>. Run <code>cd zk &amp;&amp; ./build.sh</code> before generating proofs.
          </Notice>
        </div>
      )}

      {/* Search */}
      <div className="panel-pad">
        <div className="mb-4 flex items-center gap-2">
          <Search size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-ink">{t("search.title")}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder={t("search.placeholder")}
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button className="btn-primary sm:w-36" onClick={onSearch} disabled={isSearching}>
            <Search size={16} aria-hidden="true" />
            {isSearching ? t("search.searching") : t("search.button")}
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
                        {schema ? tt(`schema.${schema.type}`, schema.label) : "Unknown type"}
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
            <h2 className="font-semibold text-ink">{t("proof.title")}</h2>
          </div>

          {/* Claim */}
          {schema.claims.length > 1 && (
            <div>
              <span className="label">{t("proof.claim")}</span>
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
                    {tt(`field.${f.key}`, f.label)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Predicate */}
          {claimField.predicates.length > 1 && (
            <div>
              <span className="label">{t("proof.statement")}</span>
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
                    {t(`pred.${p}`)}
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
                label={t("proof.setLabel", { label: tt(`field.${claimField.key}`, claimField.label) })}
                hint={t("hint.set")}
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
              <Field label={t("proof.eqLabel", { label: tt(`field.${claimField.key}`, claimField.label) })} hint={t("hint.eq")}>
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
                label={t("proof.min", { label: tt(`field.${claimField.key}`, claimField.label) })}
                hint={
                  claimField.min !== undefined
                    ? t("hint.threshold", { label: tt(`field.${claimField.key}`, claimField.label), min: claimField.min ?? "", max: claimField.max ?? "" })
                    : t("hint.hidden")
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
              {zkLoading ? t("proof.generating") : t("proof.generate")}
            </button>
          </div>

          {zkLoading && <Spinner label={t("load.proof")} />}

          {zkProof && (
            <div className="space-y-4 rounded-lg border border-valid/25 bg-valid-tint p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <CircleCheck size={16} className="text-valid-ink" aria-hidden="true" />
                {t("proof.generated")}
                {localVerified !== null && (
                  <span className="text-ink-muted">
                    · {localVerified ? t("proof.selfPassed") : t("proof.selfFailed")}
                  </span>
                )}
              </div>
              <button
                className="btn-primary w-full"
                onClick={onVerifyOnChain}
                disabled={isVerifying || !isConnected}
              >
                <FileCheck size={16} aria-hidden="true" />
                {isVerifying ? t("proof.verifying") : t("proof.verify")}
              </button>
              {!isConnected && (
                <p className="text-xs text-pending-ink">
                  {t("proof.connectNote")}
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
          <h2 className="font-serif text-xl font-semibold text-ink">{t("disc.title")}</h2>
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
          <EmptyState icon={<History size={26} />} title={t("disc.empty")}>
            Search a certificate above to see who it has been shared with.
          </EmptyState>
        )}
      </div>
    </section>
  );
};
