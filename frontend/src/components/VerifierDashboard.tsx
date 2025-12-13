import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  publicClient,
  walletClient,
  CERTIFY_CONTRACT_ADDRESS,
  CERTIFY_ABI,
} from "../lib/viemLocal";
import { useDisclosures } from "../hooks/useCertificates";
import { keccak256, toBytes } from "viem";
import { useLocalAccount } from "../hooks/useLocalAccount";
import { fetchFromIpfs } from "../lib/ipfs";
import {
  generateGpaProof,
  verifyProof,
  encodeProofForContract,
  CertificateMetadata,
  ZKProof,
} from "../lib/zkp";

interface VerifyForm {
  certificateId: string;
  fields: string;
  proof: string;
}

interface Certificate {
  id: bigint;
  issuer: string;
  holder: string;
  metadataCid: string;
  metadataCommitment: string;
  status: number;
}

export const VerifierDashboard = () => {
  const { account, address, handleSetPrivateKey } = useLocalAccount();
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [certificateId, setCertificateId] = useState<string>("");
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  /* ZK Proof states */
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [zkLoading, setZkLoading] = useState(false);
  const [zkError, setZkError] = useState<string | null>(null);
  const [localVerified, setLocalVerified] = useState<boolean | null>(null);
  const [minGpa, setMinGpa] = useState("3.00");
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyForm = useForm<VerifyForm>({
    defaultValues: { certificateId: "", fields: "{}", proof: "" },
  });

  const { data: disclosures } = useDisclosures(
    certificateId ? BigInt(certificateId) : undefined
  );

  /* Search certificate */
  const onSearch = async () => {
    if (!certificateId) return;
    setMetadata(null);
    setZkProof(null);
    setLocalVerified(null);
    setZkError(null);

    try {
      const data = await publicClient.readContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "certificates",
        args: [BigInt(certificateId)],
      });

      const cert: Certificate = {
        id: data[0] as bigint,
        issuer: data[1] as string,
        holder: data[2] as string,
        metadataCid: data[3] as string,
        metadataCommitment: data[4] as string,
        status: data[5] as number,
      };

      setSelectedCert(cert);
      verifyForm.setValue("certificateId", certificateId);

      // Fetch metadata from IPFS
      if (cert.metadataCid) {
        setIsLoadingMetadata(true);
        try {
          const meta = await fetchFromIpfs(cert.metadataCid);
          setMetadata(meta as CertificateMetadata);
        } catch (e) {
          console.error("Failed to fetch metadata:", e);
          alert("Failed to load certificate metadata from IPFS");
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Certificate not found");
    }
  };

  /* Generate ZK Proof locally */
  const handleGenerateProof = async () => {
    if (!metadata) return alert("Load certificate first");

    setZkLoading(true);
    setZkError(null);
    setLocalVerified(null);

    try {
      // Generate proof
      const proof = await generateGpaProof(metadata, minGpa);
      setZkProof(proof);

      // Verify locally
      const verified = await verifyProof(proof);
      setLocalVerified(verified);

      if (verified) {
        alert("✅ Proof generated and verified locally!");
      } else {
        alert("⚠️ Proof generated but local verification failed");
      }
    } catch (e: any) {
      setZkError(e.message);
      alert(`Failed to generate proof: ${e.message}`);
    } finally {
      setZkLoading(false);
    }
  };

  /* Verify proof on-chain */
  const handleVerifyOnChain = async () => {
    if (!zkProof || !account)
      return alert("Generate proof first and set private key");
    if (!selectedCert) return alert("Select a certificate first");

    setIsVerifying(true);

    try {
      // Encode proof using the helper function
      // Try 'standard' format first, if it fails try 'packed'
      const proofEncoded = encodeProofForContract(zkProof, "standard");

      // Generate query hash from public signals
      const queryHash = keccak256(
        toBytes(JSON.stringify(zkProof.publicSignals))
      );

      console.log("Submitting proof on-chain:", {
        certificateId: selectedCert.id.toString(),
        commitment: selectedCert.metadataCommitment,
        proofEncoded: proofEncoded.slice(0, 66) + "...",
        proofLength: proofEncoded.length,
        queryHash,
      });

      // Submit to blockchain
      const hash = await walletClient.writeContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "verifySelectiveProof",
        args: [selectedCert.id, proofEncoded, queryHash],
        account,
      });

      console.log("Transaction submitted:", hash);
      await publicClient.waitForTransactionReceipt({ hash });

      alert("✅ ZK proof verified on-chain successfully!");
    } catch (e: any) {
      console.error("On-chain verification error:", e);

      // If standard format fails, suggest trying packed format
      if (e.message.includes("ABI encoding")) {
        alert(
          `Encoding error: ${e.message}\n\nThe proof format may not match your ZKVerifier contract. Please check the contract implementation.`
        );
      } else {
        alert(`On-chain verification failed: ${e.message}`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  /* Manual verify with custom proof (existing functionality) */
  const onVerify = verifyForm.handleSubmit(async (values) => {
    if (!account) return alert("Set private key first");

    try {
      const queryHash = keccak256(toBytes(values.fields));

      console.log("Manual verification inputs:", {
        certificateId: values.certificateId,
        proof: values.proof,
        proofLength: values.proof.length,
        queryHash,
        contractAddress: CERTIFY_CONTRACT_ADDRESS,
        hasFunction: CERTIFY_ABI.some(
          (item: any) =>
            item.type === "function" && item.name === "verifySelectiveProof"
        ),
      });

      const hash = await walletClient.writeContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "verifySelectiveProof",
        args: [
          BigInt(values.certificateId),
          values.proof as `0x${string}`,
          queryHash,
        ],
        account,
      });

      console.log("Transaction hash:", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      alert("✅ Manual verification successful!");
      verifyForm.reset();
    } catch (error: any) {
      console.error("Manual verification error:", error);

      // Better error message
      if (error.message.includes("function selector was not recognized")) {
        alert(
          "Contract function not found. Please check:\n1. Contract address is correct\n2. ABI is up to date\n3. Function exists in deployed contract"
        );
      } else {
        alert(`Verification failed: ${error.message}`);
      }
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Verifier Workspace</h2>
        <p className="text-sm text-slate-300">
          Cari sertifikat, generate & verify ZK proof.
        </p>
      </header>

      {/* Private Key Input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h3 className="font-semibold">Set Private Key</h3>
        <input
          className="input w-full"
          placeholder="0x..."
          value={privateKeyInput}
          onChange={(e) => {
            setPrivateKeyInput(e.target.value);
            handleSetPrivateKey(e.target.value);
          }}
        />
        {address && (
          <p className="text-sm text-green-400">Connected: {address}</p>
        )}
      </div>

      {/* Search Certificate */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
        <h3 className="font-semibold">Search Certificate</h3>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="input flex-1"
            placeholder="Certificate ID"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
          />
          <button className="btn-primary md:w-40" onClick={onSearch}>
            Search
          </button>
        </div>

        {selectedCert && (
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">ID</dt>
                <dd className="font-mono">{selectedCert.id.toString()}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Status</dt>
                <dd>
                  {selectedCert.status === 0
                    ? "Active"
                    : selectedCert.status === 1
                    ? "Revoked"
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Issuer</dt>
                <dd className="font-mono text-xs">{selectedCert.issuer}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Holder</dt>
                <dd className="font-mono text-xs">{selectedCert.holder}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">Metadata CID</dt>
                <dd>
                  <a
                    className="text-primary text-xs"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://ipfs.io/ipfs/${selectedCert.metadataCid}`}
                  >
                    {selectedCert.metadataCid}
                  </a>
                </dd>
              </div>
            </dl>

            {isLoadingMetadata && (
              <p className="text-sm text-yellow-400">Loading metadata...</p>
            )}

            {metadata && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                <h4 className="font-semibold text-sm">Certificate Details</h4>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-400">Name</dt>
                    <dd>{metadata.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Institution</dt>
                    <dd>{metadata.institution}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Program</dt>
                    <dd>{metadata.program}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">GPA</dt>
                    <dd className="font-semibold text-green-400">
                      {metadata.gpa}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Description</dt>
                    <dd>{metadata.description}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ZK Proof Generator */}
      {metadata && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
          <h3 className="font-semibold">Generate ZK Proof</h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-400">
                Minimum GPA Threshold
              </label>
              <input
                className="input mt-1"
                type="text"
                placeholder="3.00"
                value={minGpa}
                onChange={(e) => setMinGpa(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Proof will verify that GPA ≥ {minGpa}
              </p>
            </div>

            <button
              className="btn-secondary w-full"
              onClick={handleGenerateProof}
              disabled={zkLoading}
            >
              {zkLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Proof"
              )}
            </button>

            {zkError && (
              <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
                <p className="text-sm text-red-400">❌ Error: {zkError}</p>
              </div>
            )}

            {zkProof && (
              <div className="space-y-3">
                <div className="rounded-lg bg-green-900/20 border border-green-800 p-3">
                  <p className="text-sm text-green-400">
                    ✅ Proof generated successfully!
                  </p>
                  {localVerified !== null && (
                    <p className="text-xs text-slate-400 mt-1">
                      Local verification:{" "}
                      {localVerified ? "✓ Passed" : "✗ Failed"}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  <h4 className="font-semibold text-sm mb-2">Proof Details</h4>
                  <div className="space-y-1 text-xs font-mono">
                    <div>
                      <span className="text-slate-400">Public Signals:</span>
                      <div className="text-slate-300 mt-1 space-y-1">
                        {zkProof.publicSignals.map((sig, i) => (
                          <div key={i} className="truncate">
                            [{i}]: {sig.slice(0, 40)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-primary w-full"
                  onClick={handleVerifyOnChain}
                  disabled={isVerifying || !account}
                >
                  {isVerifying ? "Verifying..." : "Verify Proof On-Chain"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Verify (existing functionality) */}
      <form
        onSubmit={onVerify}
        className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
      >
        <h3 className="font-semibold">Manual Verify (Advanced)</h3>
        <p className="text-xs text-slate-400">
          Use this if you have a pre-generated proof to verify.
        </p>
        <input
          className="input"
          placeholder="Certificate ID"
          {...verifyForm.register("certificateId", { required: true })}
        />
        <textarea
          className="input min-h-[120px]"
          placeholder='{"field":"value"}'
          {...verifyForm.register("fields", { required: true })}
        />
        <textarea
          className="input min-h-[80px]"
          placeholder="0xProofHexString"
          {...verifyForm.register("proof", { required: true })}
        />
        <button className="btn-secondary">Verify</button>
      </form>

      {/* Disclosures */}
      <div className="space-y-3">
        <h3 className="font-semibold">Disclosures</h3>
        <ul className="space-y-3">
          {disclosures?.map((d: any, idx: number) => (
            <li
              key={`${d.verifier}-${d.timestamp.toString()}-${idx}`}
              className="rounded-lg border border-slate-800 p-3 text-sm space-y-1"
            >
              <p className="font-mono text-xs">
                <span className="text-slate-400">Verifier:</span> {d.verifier}
              </p>
              <p className="font-mono text-xs break-all">
                <span className="text-slate-400">Query Hash:</span>{" "}
                {d.queryHash}
              </p>
              {d.encryptedPayloadCid && (
                <p className="font-mono text-xs">
                  <span className="text-slate-400">Encrypted CID:</span>{" "}
                  <a
                    href={`https://ipfs.io/ipfs/${d.encryptedPayloadCid}`}
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
          )) || <p className="text-sm text-slate-400">No disclosures yet.</p>}
        </ul>
      </div>
    </section>
  );
};
