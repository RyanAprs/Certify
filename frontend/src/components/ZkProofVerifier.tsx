import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  generateGpaProof,
  verifyProof,
  validateZkFiles,
  CertificateMetadata,
} from "../lib/zkp";
import { fetchJson } from "../lib/ipfs";

interface ProofForm {
  metadataCid: string;
  minGpa: string;
}

export const ZkProofVerifier = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proof, setProof] = useState<any>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [zkFilesStatus, setZkFilesStatus] = useState<any>(null);
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);

  const form = useForm<ProofForm>({
    defaultValues: {
      metadataCid: "",
      minGpa: "3.0",
    },
  });

  // Check if ZK files exist on mount
  useEffect(() => {
    const checkFiles = async () => {
      const status = await validateZkFiles();
      setZkFilesStatus(status);

      if (!status.wasm || !status.zkey || !status.vkey) {
        console.warn("Some ZK files are missing:", status);
      }
    };
    checkFiles();
  }, []);

  const onGenerateProof = form.handleSubmit(async (values) => {
    try {
      setIsGenerating(true);
      setProof(null);
      setVerified(null);
      setMetadata(null);

      // Check if files exist
      if (
        zkFilesStatus &&
        (!zkFilesStatus.wasm || !zkFilesStatus.zkey || !zkFilesStatus.vkey)
      ) {
        throw new Error(
          "ZK files not found in public/zk/ directory. Please ensure certify.wasm, certify.zkey, and verification_key.json are present."
        );
      }

      console.log("📥 Fetching metadata from IPFS...");
      const fetchedMetadata = await fetchJson<CertificateMetadata>(
        values.metadataCid
      );
      console.log("✅ Metadata fetched:", fetchedMetadata);
      setMetadata(fetchedMetadata);

      // Validate GPA
      const actualGpa = parseFloat(fetchedMetadata.gpa);
      const minimumGpa = parseFloat(values.minGpa);

      if (actualGpa < minimumGpa) {
        alert(
          `⚠️ Certificate GPA (${actualGpa}) is below minimum requirement (${minimumGpa}). Proof will fail.`
        );
      }

      console.log("🔐 Generating ZK proof...");
      console.log("This may take 10-30 seconds...");
      const zkProof = await generateGpaProof(fetchedMetadata, values.minGpa);
      console.log("✅ Proof generated");

      setProof(zkProof);

      console.log("🔍 Verifying proof locally...");
      const isValid = await verifyProof(zkProof);
      setVerified(isValid);

      if (isValid) {
        alert(
          "✅ Proof generated and verified successfully!\n\nYou have proven that your GPA ≥ " +
            values.minGpa +
            " without revealing your actual GPA."
        );
      } else {
        alert("❌ Proof verification failed!");
      }
    } catch (error: any) {
      console.error("❌ Proof generation failed:", error);
      alert(`Error: ${error.message || "Failed to generate proof"}`);
    } finally {
      setIsGenerating(false);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">
          🔐 Zero-Knowledge Proof Verifier
        </h2>
        <p className="text-sm text-slate-300">
          Prove you have a certificate with minimum GPA without revealing actual
          GPA or identity.
        </p>
      </header>

      {/* ZK Files Status */}
      {zkFilesStatus && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            zkFilesStatus.wasm && zkFilesStatus.zkey && zkFilesStatus.vkey
              ? "border-green-500/30 bg-green-500/5 text-green-400"
              : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
          }`}
        >
          <p className="font-semibold mb-1">ZK Files Status:</p>
          <ul className="space-y-0.5 ml-4">
            <li>• certify.wasm: {zkFilesStatus.wasm ? "✅" : "❌ Missing"}</li>
            <li>• certify.zkey: {zkFilesStatus.zkey ? "✅" : "❌ Missing"}</li>
            <li>
              • verification_key.json:{" "}
              {zkFilesStatus.vkey ? "✅" : "❌ Missing"}
            </li>
          </ul>
          {(!zkFilesStatus.wasm ||
            !zkFilesStatus.zkey ||
            !zkFilesStatus.vkey) && (
            <p className="mt-2 text-red-400">
              ⚠️ Please ensure all files are in the public/zk/ directory
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={onGenerateProof}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h3 className="font-semibold">Generate GPA Proof</h3>

        <div className="space-y-2">
          <label className="text-sm text-slate-400">
            Metadata CID (from IPFS)
          </label>
          <input
            className="input"
            placeholder="bafybeig..."
            disabled={isGenerating}
            {...form.register("metadataCid", { required: true })}
          />
          <p className="text-xs text-slate-500">
            Get this from your certificate details
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400">Minimum GPA to Prove</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder="3.0"
            disabled={isGenerating}
            {...form.register("minGpa", { required: true })}
          />
          <p className="text-xs text-slate-500">
            Prove your GPA is at least this value without revealing the actual
            GPA
          </p>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isGenerating}
        >
          {isGenerating ? (
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
              Generating Proof... (10-30s)
            </span>
          ) : (
            "Generate ZK Proof"
          )}
        </button>

        {isGenerating && (
          <div className="text-xs text-yellow-400 animate-pulse bg-yellow-400/10 border border-yellow-400/30 rounded p-3">
            <p className="font-semibold mb-1">⏳ Please wait...</p>
            <ul className="ml-4 space-y-0.5">
              <li>• Loading circuit files from /zk/</li>
              <li>• Computing witness</li>
              <li>• Generating zero-knowledge proof</li>
            </ul>
          </div>
        )}
      </form>

      {/* Metadata Display */}
      {metadata && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
          <h3 className="font-semibold text-sm mb-2">
            📄 Certificate Metadata
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Name:</p>
              <p className="text-slate-200">{metadata.name}</p>
            </div>
            <div>
              <p className="text-slate-400">GPA:</p>
              <p className="text-slate-200 font-mono">{metadata.gpa}</p>
            </div>
            <div>
              <p className="text-slate-400">Institution:</p>
              <p className="text-slate-200">{metadata.institution}</p>
            </div>
            <div>
              <p className="text-slate-400">Program:</p>
              <p className="text-slate-200">{metadata.program}</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Result */}
      {verified !== null && (
        <div
          className={`rounded-xl border p-6 ${
            verified
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
          }`}
        >
          <h3 className="font-semibold mb-3 text-lg">
            {verified ? "✅ Proof Verified" : "❌ Verification Failed"}
          </h3>
          {verified ? (
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">
                <strong>What was proven:</strong> The certificate holder
                successfully proved they have a GPA of at least{" "}
                <span className="text-green-400 font-mono">
                  {form.getValues("minGpa")}
                </span>
                {metadata && (
                  <>
                    {" "}
                    (actual:{" "}
                    <span className="text-slate-500">{metadata.gpa}</span>)
                  </>
                )}
              </p>
              <p className="text-slate-400">
                <strong>What remains private:</strong> In a real scenario, the
                actual GPA value would remain completely hidden. Only the proof
                that GPA ≥ minimum is revealed.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              The proof could not be verified. This may happen if the GPA does
              not meet the minimum requirement, or if there was an error in
              proof generation.
            </p>
          )}
        </div>
      )}

      {/* Proof Details */}
      {proof && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-3">
          <h3 className="font-semibold">Generated Proof Details</h3>

          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              Public Signals (visible to verifier):
            </p>
            <div className="bg-slate-950 p-3 rounded text-xs font-mono space-y-1">
              <p className="text-slate-500">// [0] Metadata commitment</p>
              <p className="text-green-400 break-all">
                {proof.publicSignals[0]}
              </p>
              <p className="text-slate-500 mt-2">// [1] Minimum GPA × 100</p>
              <p className="text-green-400">{proof.publicSignals[1]}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              Proof Components (cryptographic proof):
            </p>
            <div className="bg-slate-950 p-3 rounded text-xs max-h-40 overflow-y-auto">
              <pre className="text-slate-500">
                {JSON.stringify(proof.proof, null, 2)}
              </pre>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
              alert("Proof copied to clipboard!");
            }}
            className="btn-secondary w-full"
          >
            Copy Proof to Clipboard
          </button>
        </div>
      )}

      {/* How it Works */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
        <h4 className="font-semibold text-sm mb-2">💡 How it works</h4>
        <ul className="text-xs text-slate-400 space-y-1.5">
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">1.</span>
            <span>
              ZK circuit proves{" "}
              <code className="text-blue-300">actualGPA ≥ minGPA</code> without
              revealing actualGPA
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">2.</span>
            <span>
              Metadata commitment ensures certificate authenticity (prevents
              fake proofs)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">3.</span>
            <span>Verifier can confirm proof validity locally or on-chain</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0">4.</span>
            <span>Your identity and actual GPA remain completely private</span>
          </li>
        </ul>
      </div>
    </section>
  );
};
