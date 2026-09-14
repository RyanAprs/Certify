import { useState } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

import { useDisclosures } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import { publicClient, registryContract } from "../lib/contract";
import { fetchFromIpfs, ipfsUrl } from "../lib/ipfs";
import { Notice, Spinner } from "./Shared";
import { CertificateStatus } from "../types";
import {
  generateGpaProof,
  verifyProof,
  formatProofForSolidity,
  validateZkFiles,
  CertificateMetadata,
  ZKProof,
} from "../lib/zkp";
import { useEffect } from "react";

interface Cert {
  id: bigint;
  issuer: string;
  holder: string;
  metadataCid: string;
  metadataCommitment: `0x${string}`;
  status: CertificateStatus;
}

function toStatus(n: number): CertificateStatus {
  return n === 0 ? "Pending" : n === 1 ? "Active" : "Revoked";
}

export const VerifierDashboard = () => {
  const { isConnected } = useAccount();
  const { write } = useRegistryWrite();

  const [certificateId, setCertificateId] = useState("");
  const [cert, setCert] = useState<Cert | null>(null);
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [minGpa, setMinGpa] = useState("3.00");
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [localVerified, setLocalVerified] = useState<boolean | null>(null);
  const [zkLoading, setZkLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [zkFilesOk, setZkFilesOk] = useState<boolean | null>(null);

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
      })) as readonly [
        bigint,
        string,
        string,
        string,
        `0x${string}`,
        number,
        bigint
      ];
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
      };
      setCert(found);
      if (found.metadataCid) {
        try {
          setMetadata(await fetchFromIpfs<CertificateMetadata>(found.metadataCid));
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
    if (!metadata) return toast.error("Load a certificate first");
    if (!metadata.secret) {
      return toast.error(
        "This certificate's metadata has no ZK secret (issued before the ZK upgrade)."
      );
    }
    setZkLoading(true);
    setLocalVerified(null);
    try {
      const proof = await generateGpaProof(metadata, minGpa);
      setZkProof(proof);
      setLocalVerified(await verifyProof(proof));
      toast.success("Proof generated & locally verified");
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
      await write(
        "verifySelectiveProof",
        [cert.id, a, b, c, pubSignals],
        { pending: "Verifying proof on-chain…", success: "Proof verified on-chain ✅" }
      );
    } catch {
      /* toast shown by useRegistryWrite */
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Verifier Workspace</h2>
        <p className="text-sm text-slate-300">
          Look up a certificate, then generate and verify a GPA-threshold proof.
        </p>
      </header>

      {zkFilesOk === false && (
        <Notice tone="warning" title="ZK artifacts missing">
          <code>certify.wasm</code>/<code>certify.zkey</code> not found in{" "}
          <code>public/zk/</code>. Run <code>cd zk &amp;&amp; ./build.sh</code> to
          build the circuit before generating proofs.
        </Notice>
      )}

      {/* Search */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <h3 className="font-semibold">Search Certificate</h3>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="input flex-1"
            placeholder="Certificate ID"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
          />
          <button className="btn-primary md:w-40" onClick={onSearch} disabled={isSearching}>
            {isSearching ? "Searching…" : "Search"}
          </button>
        </div>

        {cert && (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">ID</dt>
                <dd className="font-mono">{cert.id.toString()}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Status</dt>
                <dd>{cert.status}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Issuer</dt>
                <dd className="break-all font-mono text-xs">{cert.issuer}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Holder</dt>
                <dd className="break-all font-mono text-xs">{cert.holder}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Metadata CID</dt>
                <dd>
                  <a
                    className="text-primary text-xs break-all"
                    target="_blank"
                    rel="noreferrer"
                    href={ipfsUrl(cert.metadataCid)}
                  >
                    {cert.metadataCid}
                  </a>
                </dd>
              </div>
            </dl>

            {metadata && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <h4 className="mb-2 text-sm font-semibold">Certificate Details</h4>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-slate-400">Name</dt><dd>{metadata.name}</dd></div>
                  <div><dt className="text-slate-400">Institution</dt><dd>{metadata.institution}</dd></div>
                  <div><dt className="text-slate-400">Program</dt><dd>{metadata.program}</dd></div>
                  <div>
                    <dt className="text-slate-400">GPA</dt>
                    <dd className="font-semibold text-green-400">{metadata.gpa}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proof */}
      {metadata && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h3 className="font-semibold">Generate GPA Proof</h3>
          <label className="block space-y-1">
            <span className="text-sm text-slate-400">Minimum GPA to prove (0–5)</span>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={minGpa}
              onChange={(e) => setMinGpa(e.target.value)}
            />
          </label>
          <p className="text-xs text-slate-500">
            Proves GPA ≥ {minGpa} without revealing the actual value.
          </p>

          <button
            className="btn-secondary w-full"
            onClick={onGenerateProof}
            disabled={zkLoading || zkFilesOk === false}
          >
            {zkLoading ? "Generating…" : "Generate Proof"}
          </button>

          {zkLoading && <Spinner label="Computing zero-knowledge proof…" />}

          {zkProof && (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-800 bg-green-900/20 p-3">
                <p className="text-sm text-green-400">✅ Proof generated</p>
                {localVerified !== null && (
                  <p className="text-xs text-slate-400">
                    Local verification: {localVerified ? "✓ passed" : "✗ failed"}
                  </p>
                )}
              </div>
              <button
                className="btn-primary w-full"
                onClick={onVerifyOnChain}
                disabled={isVerifying || !isConnected}
              >
                {isVerifying ? "Verifying…" : "Verify Proof On-Chain"}
              </button>
              {!isConnected && (
                <p className="text-xs text-yellow-400">
                  Connect a wallet to submit the on-chain verification.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disclosures */}
      <div className="space-y-3">
        <h3 className="font-semibold">Disclosures</h3>
        <ul className="space-y-3">
          {disclosures && disclosures.length > 0 ? (
            disclosures.map((d: any, idx: number) => (
              <li
                key={`${d.verifier}-${d.timestamp.toString()}-${idx}`}
                className="space-y-1 rounded-lg border border-slate-800 p-3 text-sm"
              >
                <p className="break-all font-mono text-xs">
                  <span className="text-slate-400">Verifier:</span> {d.verifier}
                </p>
                <p className="break-all font-mono text-xs">
                  <span className="text-slate-400">Query Hash:</span> {d.queryHash}
                </p>
                {d.encryptedPayloadCid && (
                  <p className="font-mono text-xs">
                    <span className="text-slate-400">Encrypted CID:</span>{" "}
                    <a
                      href={ipfsUrl(d.encryptedPayloadCid)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary"
                    >
                      {d.encryptedPayloadCid}
                    </a>
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {new Date(Number(d.timestamp) * 1000).toLocaleString()}
                </p>
              </li>
            ))
          ) : (
            <p className="text-sm text-slate-400">No disclosures yet.</p>
          )}
        </ul>
      </div>
    </section>
  );
};
