import { useForm } from "react-hook-form";
import { useHolderCertificates } from "../hooks/useCertificates";
import { CertificateCard } from "./Shared";
import { keccak256, toBytes, encodePacked, parseAbiItem } from "viem";
import { uploadJson } from "../lib/ipfs";
import { useEffect, useState } from "react";
import { useLocalAccount } from "../hooks/useLocalAccount";
import {
  writeContractFresh,
  CERTIFY_CONTRACT_ADDRESS,
  CERTIFY_ABI,
  walletClient,
  publicClient,
} from "../lib/viemLocal";

interface MembershipForm {
  issuer: string;
}

interface ShareForm {
  certificateId: string;
  verifier: string;
  fields: string;
}

export const HolderDashboard = () => {
  const { account, address, handleSetPrivateKey } = useLocalAccount();
  const { data: certificates } = useHolderCertificates(
    address as `0x${string}`
  );
  const [lastProof, setLastProof] = useState<string | null>(null);
  const [isRequestingMembership, setIsRequestingMembership] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  // state tambahan
  const [memberships, setMemberships] = useState<`0x${string}`[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  // helper baca log MemberDecision
  const fetchMemberships = async () => {
    if (!address) return;
    setIsChecking(true);
    try {
      const current = await publicClient.getBlockNumber();
      const logs = await publicClient.getLogs({
        address: CERTIFY_CONTRACT_ADDRESS,
        event: parseAbiItem(
          "event MemberDecision(address indexed issuer, address indexed holder, bool approved)"
        ),
        fromBlock: current - 100n < 0n ? 0n : current - 100n,
        toBlock: "latest",
      });

      // ambil issuer yg sudah approve holder ini
      const approved = logs
        .filter(
          (l) =>
            l.args.holder.toLowerCase() === address.toLowerCase() &&
            l.args.approved
        )
        .map((l) => l.args.issuer);

      // hilangkan duplikat
      setMemberships([...new Set(approved)]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  // panggil sekali saat mount & tiap address berubah
  useEffect(() => {
    fetchMemberships();
  }, [address]);

  const membershipForm = useForm<MembershipForm>({
    defaultValues: { issuer: "" },
  });
  const shareForm = useForm<ShareForm>({
    defaultValues: {
      certificateId: "",
      verifier: "",
      fields: '{"name":"Jane Doe"}',
    },
  });

  useEffect(() => {
    const key = localStorage.getItem("privateKey");
    if (key) {
      setPrivateKeyInput(key);
    }
  }, []);

  const onMembership = membershipForm.handleSubmit(async (values) => {
    if (!account) return alert("Set private key first");
    try {
      setIsRequestingMembership(true);
      await writeContractFresh({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "requestMembership",
        args: [values.issuer as `0x${string}`],
        account,
      });
      membershipForm.reset();
      alert("Membership request sent successfully!");
    } catch (error) {
      console.error("Membership request failed:", error);
      alert("Failed to send membership request. Please try again.");
    } finally {
      setIsRequestingMembership(false);
    }
  });

  const onShare = shareForm.handleSubmit(async (values) => {
    if (!account) return alert("Set private key first");
    try {
      setIsSharing(true);
      const payload = JSON.parse(values.fields);
      const queryHash = keccak256(toBytes(JSON.stringify(payload)));
      const certificate = certificates?.find(
        (c) => c.id === BigInt(values.certificateId)
      );
      if (!certificate) throw new Error("Certificate not found");
      const digest = keccak256(
        encodePacked(
          ["bytes32", "bytes32"],
          [certificate.metadataCommitment as `0x${string}`, queryHash]
        )
      );
      const signature = await walletClient.signMessage({
        account,
        message: { raw: digest },
      });
      const encryptedPayloadCid = await uploadJson({
        payload,
        sharedAt: Date.now(),
        signature,
      });
      await writeContractFresh({
        address: CERTIFY_CONTRACT_ADDRESS,
        abi: CERTIFY_ABI,
        functionName: "shareCertificate",
        args: [
          BigInt(values.certificateId),
          values.verifier as `0x${string}`,
          queryHash,
          encryptedPayloadCid,
        ],
        account,
      });
      setLastProof(signature);
      shareForm.reset();
      alert("Certificate shared successfully!");
    } catch (error) {
      console.error("Share certificate failed:", error);
      alert("Failed to share certificate. Please try again.");
    } finally {
      setIsSharing(false);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Holder Workspace</h2>
        <p className="text-sm text-slate-300">
          Kelola akses sertifikat dan selective disclosure.
        </p>
      </header>

      {/* Input Private Key */}
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

      {/* Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={onMembership}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Join Issuer</h3>
          <input
            className="input"
            placeholder="Issuer address"
            disabled={isRequestingMembership}
            {...membershipForm.register("issuer", { required: true })}
          />
          <button
            className="btn-primary w-full"
            disabled={isRequestingMembership}
          >
            {isRequestingMembership ? (
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
                Processing...
              </span>
            ) : (
              "Request Access"
            )}
          </button>
          {isRequestingMembership && (
            <p className="text-xs text-yellow-400 animate-pulse">
              ⏳ Waiting for transaction confirmation...
            </p>
          )}
        </form>

        <form
          onSubmit={onShare}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Share Certificate</h3>
          <input
            className="input"
            placeholder="Certificate ID"
            disabled={isSharing}
            {...shareForm.register("certificateId", { required: true })}
          />
          <input
            className="input"
            placeholder="Verifier address"
            disabled={isSharing}
            {...shareForm.register("verifier", { required: true })}
          />
          <textarea
            className="input min-h-[120px]"
            placeholder='{"field":"value"}'
            disabled={isSharing}
            {...shareForm.register("fields", { required: true })}
          />
          <button className="btn-secondary w-full" disabled={isSharing}>
            {isSharing ? (
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
                Processing...
              </span>
            ) : (
              "Share Selectively"
            )}
          </button>
          {isSharing && (
            <p className="text-xs text-yellow-400 animate-pulse">
              ⏳ Signing and uploading to IPFS...
            </p>
          )}
          {lastProof && !isSharing && (
            <p className="text-xs text-slate-400 break-all">
              Latest selective disclosure proof signature:
              <br />
              {lastProof}
            </p>
          )}
        </form>
      </div>

      {/* Certificates List */}
      <div className="space-y-3">
        <h3 className="font-semibold">Certificates</h3>

        {/* status keanggotaan */}
        {!isChecking && memberships.length > 0 && (
          <div className="rounded-lg border border-green-700 bg-green-900/30 p-3">
            <p className="text-sm text-green-300">✅ You're a member of:</p>
            <ul className="mt-1 list-inside list-disc text-xs text-green-200">
              {memberships.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* daftar sertifikat (tetap seperti semula) */}
        <div className="grid gap-4">
          {certificates?.map((c) => (
            <CertificateCard key={c.id.toString()} certificate={c} />
          )) || <p className="text-sm text-slate-400">Belum ada sertifikat.</p>}
        </div>
      </div>
    </section>
  );
};
