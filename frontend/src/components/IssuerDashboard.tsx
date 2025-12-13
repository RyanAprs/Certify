import { useForm } from "react-hook-form";
import { useIssuerCertificates } from "../hooks/useCertificates";
import { CertificateCard } from "./Shared";
import { uploadFile, uploadJson } from "../lib/ipfs";
import { keccak256, parseAbiItem, toBytes, decodeEventLog } from "viem";
import { useLocalAccount } from "../hooks/useLocalAccount";
import {
  walletClient,
  publicClient,
  CERTIFY_CONTRACT_ADDRESS,
  CERTIFY_ABI,
} from "../lib/viemLocal";
import { useEffect, useState } from "react";

/* ---------- ZK imports ---------- */
import {
  generateGpaProof,
  formatProofForSolidity,
  ZKProof,
  CertificateMetadata,
} from "../lib/zkp";

interface IssueForm {
  holder: string;
  name: string;
  institution: string;
  program: string;
  gpa: string;
  description: string;
  image: FileList;
}

export const IssuerDashboard = () => {
  const { account, address, handleSetPrivateKey } = useLocalAccount();
  const { data: certificates, refetch } = useIssuerCertificates(
    address as `0x${string}`
  );

  /* ---------- existing states ---------- */
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [requests, setRequests] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [processingHolder, setProcessingHolder] = useState<string | null>(null);

  /* ---------- ZK states ---------- */
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [zkLoading, setZkLoading] = useState(false);
  const [zkError, setZkError] = useState<string | null>(null);
  const [minGpa] = useState("3.00"); // bisa diubah sesuai kebutuhan

  const issueForm = useForm<IssueForm>({
    defaultValues: {
      holder: "",
      name: "",
      institution: "",
      program: "",
      gpa: "",
      description: "",
    },
  });

  /* ---------- existing logic (fetchRequestsAndMembers, onApprove) ---------- */
  const fetchRequestsAndMembers = async () => {
    if (!address) return;
    setIsLoadingMembers(true);
    try {
      const current = await publicClient.getBlockNumber();
      const logs = await publicClient.getLogs({
        address: CERTIFY_CONTRACT_ADDRESS,
        event: parseAbiItem(
          "event MemberRequested(address indexed issuer, address indexed holder)"
        ),
        fromBlock: current - 100n < 0n ? 0n : current - 100n,
        toBlock: "latest",
      });

      const forMe = logs.filter(
        (l) => l.args.issuer.toLowerCase() === address.toLowerCase()
      );

      const holders = [
        ...new Set(forMe.map((l) => l.args.holder.toLowerCase())),
      ];

      const results = await Promise.all(
        holders.map(async (holder) => {
          try {
            const req = await publicClient.readContract({
              address: CERTIFY_CONTRACT_ADDRESS,
              abi: CERTIFY_ABI,
              functionName: "memberRequests",
              args: [address, holder as `0x${string}`],
            });

            let applicant, approved, decided;
            if (Array.isArray(req)) {
              [applicant, approved, decided] = req;
            } else if (typeof req === "object" && req !== null) {
              applicant = req.applicant;
              approved = req.approved;
              decided = req.decided;
            } else return null;

            return {
              holder,
              decided: Boolean(decided),
              approved: Boolean(approved),
            };
          } catch {
            return null;
          }
        })
      );

      const valid = results.filter((r) => r !== null);
      setRequests(valid.filter((r) => !r.decided).map((r) => r.holder));
      setMembers(
        valid.filter((r) => r.decided && r.approved).map((r) => r.holder)
      );
    } catch (err) {
      console.error(err);
      alert("Gagal load member");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const onApprove = async (holder: string, approve: boolean) => {
    if (!account) return alert("Set private key first");
    setProcessingHolder(holder);
    try {
      const hash = await walletClient.writeContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "manageMember",
        args: [holder as `0x${string}`, approve],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchRequestsAndMembers();
      alert(approve ? "Member approved!" : "Member rejected!");
    } catch (error) {
      console.error(error);
      alert("Failed to process decision");
    } finally {
      setProcessingHolder(null);
    }
  };

  /* ---------- ZK helpers ---------- */
  const handleGenerateProof = async (
    metadata: CertificateMetadata
  ): Promise<ZKProof | null> => {
    setZkLoading(true);
    setZkError(null);
    try {
      const proof = await generateGpaProof(metadata, minGpa);
      setZkProof(proof);
      return proof;
    } catch (e: any) {
      setZkError(e.message);
      return null;
    } finally {
      setZkLoading(false);
    }
  };

  /* ---------- issue certificate + ZK ---------- */
  const onIssue = issueForm.handleSubmit(async (values) => {
    if (!account) return alert("Set private key first");
    setIsIssuing(true);
    setZkProof(null);
    setZkError(null);
    try {
      const file = values.image?.item(0);
      if (!file) throw new Error("Certificate image required");

      /* 1. upload IPFS */
      const imageCid = await uploadFile(file);
      const metadata: CertificateMetadata = {
        name: values.name,
        institution: values.institution,
        program: values.program,
        gpa: values.gpa,
        description: values.description,
        imageCid,
        issuedAt: new Date().toISOString(),
      };
      const metadataCid = await uploadJson(metadata);
      const metadataCommitment = keccak256(toBytes(JSON.stringify(metadata)));

      /* 2. generate ZK proof (optional) */
      const proof = await handleGenerateProof(metadata);
      if (!proof) console.warn("ZK proof skipped / failed");

      console.log("Generated ZK Proof:", proof);

      /* 3. issue certificate */
      const hash = await walletClient.writeContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "issueCertificate",
        args: [values.holder as `0x${string}`, metadataCid, metadataCommitment],
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      /* 4. Parse certificate ID from logs */
      let certificateId: bigint | undefined;

      // Try to find CertificateIssued event in logs
      const certificateIssuedEvent = parseAbiItem(
        "event CertificateIssued(uint256 indexed certificateId, address indexed issuer, address indexed holder)"
      );

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: [certificateIssuedEvent],
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "CertificateIssued") {
            certificateId = decoded.args.certificateId as bigint;
            break;
          }
        } catch (e) {
          // Skip logs that don't match
          continue;
        }
      }

      issueForm.reset();
      refetch();

      if (certificateId !== undefined) {
        alert(`✅ Certificate issued! ID: ${certificateId.toString()}`);
      } else {
        alert("✅ Certificate issued successfully!");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Issue failed: ${error.message}`);
    } finally {
      setIsIssuing(false);
    }
  });

  /* ---------- mount ---------- */
  useEffect(() => {
    const key = localStorage.getItem("privateKey");
    if (key) setPrivateKeyInput(key);
    fetchRequestsAndMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  /* ---------- render ---------- */
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Issuer Workspace</h2>
        <p className="text-sm text-slate-300">
          Terbitkan sertifikat + unggah image ke IPFS dan kelola holder.
        </p>
      </header>

      {/* Private Key setter */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h3 className="font-semibold">Set Private Key</h3>
        <input
          value={privateKeyInput}
          className="input w-full"
          placeholder="Private Key"
          onChange={(e) => handleSetPrivateKey(e.target.value)}
        />
        {address && (
          <p className="text-sm text-green-400">Connected: {address}</p>
        )}
      </div>

      {/* Create Certificate form */}
      <div className="">
        <form
          onSubmit={onIssue}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Create Certificate</h3>
          <input
            className="input"
            placeholder="Holder Address"
            disabled={isIssuing}
            {...issueForm.register("holder", { required: true })}
          />
          <input
            className="input"
            placeholder="Nama"
            disabled={isIssuing}
            {...issueForm.register("name", { required: true })}
          />
          <input
            className="input"
            placeholder="Institusi"
            disabled={isIssuing}
            {...issueForm.register("institution", { required: true })}
          />
          <input
            className="input"
            placeholder="Program Studi"
            disabled={isIssuing}
            {...issueForm.register("program", { required: true })}
          />
          <input
            className="input"
            placeholder="GPA"
            disabled={isIssuing}
            {...issueForm.register("gpa", { required: true })}
          />
          <textarea
            className="input min-h-[80px]"
            placeholder="Deskripsi"
            disabled={isIssuing}
            {...issueForm.register("description", { required: true })}
          />
          <label className="text-sm text-slate-400">
            Upload Certificate Image (PNG/JPEG)
          </label>
          <input
            className="input"
            type="file"
            accept="image/*"
            disabled={isIssuing}
            {...issueForm.register("image", { required: true })}
          />

          {/* ZK status */}
          {zkLoading && (
            <p className="text-xs text-yellow-400">⏳ Generating ZK proof...</p>
          )}
          {zkError && (
            <p className="text-xs text-red-400">❌ ZK error: {zkError}</p>
          )}
          {zkProof && (
            <p className="text-xs text-green-400">✅ ZK proof ready</p>
          )}

          <button className="btn-primary w-full" disabled={isIssuing}>
            {isIssuing ? (
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
                Issuing...
              </span>
            ) : (
              "Issue Certificate"
            )}
          </button>
        </form>
      </div>

      {/* Pending Requests & Approved Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pending Requests</h3>
          <button
            onClick={() => fetchRequestsAndMembers()}
            disabled={isLoadingMembers}
            className="text-xs uppercase tracking-wide text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {isLoadingMembers ? "Loading..." : "Refresh"}
          </button>
        </div>
        {requests.length === 0 && (
          <p className="text-sm text-slate-400">No pending requests.</p>
        )}
        {requests.map((holder) => (
          <div
            key={holder}
            className="flex md:flex-row flex-col justify-between items-center rounded-lg border border-slate-800 p-3"
          >
            <p className="text-sm font-mono">{holder}</p>
            <div className="flex gap-7 p-4">
              <button
                onClick={() => onApprove(holder, true)}
                disabled={processingHolder === holder}
                className="btn-secondary disabled:opacity-50"
              >
                {processingHolder === holder ? "..." : "Approve"}
              </button>
              <button
                onClick={() => onApprove(holder, false)}
                disabled={processingHolder === holder}
                className="btn-danger disabled:opacity-50"
              >
                {processingHolder === holder ? "..." : "Reject"}
              </button>
            </div>
          </div>
        ))}

        <h3 className="font-semibold mt-6">Approved Members</h3>
        {members.length === 0 && (
          <p className="text-sm text-slate-400">No members yet.</p>
        )}
        {members.map((member) => (
          <div key={member} className="rounded-lg border border-slate-800 p-3">
            <p className="text-sm font-mono">{member}</p>
          </div>
        ))}
      </div>

      {/* Certificates list + ZK verify button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Certificates</h3>
          <button
            onClick={() => refetch()}
            className="text-xs uppercase tracking-wide text-primary"
          >
            Refresh
          </button>
        </div>
        <div className="grid gap-4">
          {certificates?.map((c) => (
            <div
              key={c.id.toString()}
              className="rounded-lg border border-slate-800 p-4"
            >
              <CertificateCard certificate={c} />
            </div>
          )) || <p className="text-sm text-slate-400">No certificates yet.</p>}
        </div>
      </div>
    </section>
  );
};
