import { useForm } from "react-hook-form";
import { useIssuerCertificates } from "../hooks/useCertificates";
import { CertificateCard } from "./Shared";
import { uploadFile, uploadJson } from "../lib/ipfs";
import { keccak256, parseAbiItem, toBytes } from "viem";
import { useLocalAccount } from "../hooks/useLocalAccount";
import {
  walletClient,
  publicClient,
  CERTIFY_CONTRACT_ADDRESS,
  CERTIFY_ABI,
} from "../lib/viemLocal";
import { useEffect, useState } from "react";

interface IssueForm {
  holder: string;
  name: string;
  institution: string;
  program: string;
  gpa: string;
  description: string;
  image: FileList;
}

interface MemberDecisionForm {
  holder: string;
  approve: boolean;
}

export const IssuerDashboard = () => {
  const { account, address, handleSetPrivateKey } = useLocalAccount();
  const { data: certificates, refetch } = useIssuerCertificates(
    address as `0x${string}`
  );
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [requests, setRequests] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [processingHolder, setProcessingHolder] = useState<string | null>(null);

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

  const decisionForm = useForm<MemberDecisionForm>({
    defaultValues: { holder: "", approve: true },
  });

  const fetchRequestsAndMembers = async () => {
    if (!address) return;
    try {
      setIsLoadingMembers(true);

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

      const holders = forMe.map((l) => l.args.holder);

      console.log("current block", await publicClient.getBlockNumber());
      console.log("contract", CERTIFY_CONTRACT_ADDRESS);
      console.log("my address", address);
      console.log("all MemberRequested logs", logs);
      console.log("filtered forMe", forMe);
      console.log("holders", holders);

      const results = await Promise.all(
        holders.map(async (holder) => {
          const req = await publicClient.readContract({
            address: CERTIFY_CONTRACT_ADDRESS,
            abi: CERTIFY_ABI,
            functionName: "memberRequests",
            args: [address, holder],
          });
          return { holder, decided: req.decided, approved: req.approved };
        })
      );

      setRequests(results.filter((r) => !r.decided).map((r) => r.holder));
      setMembers(results.filter((r) => r.approved).map((r) => r.holder));
    } catch (err) {
      console.error(err);
      alert("Gagal load member");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    const key = localStorage.getItem("privateKey");
    if (key) {
      setPrivateKeyInput(key);
    }
    fetchRequestsAndMembers();
  }, [address]);

  const onIssue = issueForm.handleSubmit(async (values) => {
    if (!account) return alert("Set private key first");
    try {
      setIsIssuing(true);
      const file = values.image?.item(0);
      if (!file) throw new Error("Certificate image required");
      const imageCid = await uploadFile(file);
      const metadata = {
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
      await walletClient.writeContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "issueCertificate",
        args: [values.holder as `0x${string}`, metadataCid, metadataCommitment],
        account,
      });
      issueForm.reset();
      refetch();
      alert("Certificate issued successfully!");
    } catch (error) {
      console.error("Issue certificate failed:", error);
      alert("Failed to issue certificate. Please try again.");
    } finally {
      setIsIssuing(false);
    }
  });

  const removeFromPending = (holder: string) => {
    setRequests((prev) =>
      prev.filter((h) => h.toLowerCase() !== holder.toLowerCase())
    );
  };

  const onApprove = async (holder: string, approve: boolean) => {
    if (!account) return alert("Set private key first");
    try {
      setProcessingHolder(holder);
      const hash = await walletClient.writeContract({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "manageMember",
        args: [holder as `0x${string}`, approve],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });

      // --- update state lokal ---
      if (approve) {
        setMembers((prev) =>
          prev.includes(holder) ? prev : [...prev, holder]
        );
      }
      removeFromPending(holder);
      // --------------------------------
      alert(approve ? "Member approved!" : "Member rejected!");
    } catch (error) {
      console.error(error);
      alert("Failed to process decision");
    } finally {
      setProcessingHolder(null);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Issuer Workspace</h2>
        <p className="text-sm text-slate-300">
          Terbitkan sertifikat + unggah image ke IPFS dan kelola holder.
        </p>
      </header>

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
          <button className="btn-primary w-full" disabled={isIssuing}>
            {isIssuing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg "
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
          {isIssuing && (
            <p className="text-xs text-yellow-400 animate-pulse">
              ⏳ Uploading to IPFS and issuing on blockchain...
            </p>
          )}
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pending Requests</h3>
          <button
            onClick={() => fetchRequestsAndMembers()}
            disabled={isLoadingMembers}
            className="text-xs uppercase tracking-wide text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {isLoadingMembers ? (
              <span className="flex items-center gap-1">
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg "
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
                Loading...
              </span>
            ) : (
              "Refresh"
            )}
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
                {processingHolder === holder ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg "
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
                  </span>
                ) : (
                  "Approve"
                )}
              </button>
              <button
                onClick={() => onApprove(holder, false)}
                disabled={processingHolder === holder}
                className="btn-danger disabled:opacity-50"
              >
                {processingHolder === holder ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg "
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
                  </span>
                ) : (
                  "Reject"
                )}
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
            <CertificateCard key={c.id.toString()} certificate={c} />
          )) || <p className="text-sm text-slate-400">No certificates yet.</p>}
        </div>
      </div>
    </section>
  );
};
