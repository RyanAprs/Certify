import { useForm } from "react-hook-form";
import { useHolderCertificates } from "../hooks/useCertificates";
import { useCertifyWrites } from "../hooks/useCertifyContract";
import { CertificateCard } from "./Shared";
import { keccak256, toBytes, encodePacked } from "viem";
import { uploadJson } from "../lib/ipfs";
import { useAccount, useWalletClient } from "wagmi";
import { useState } from "react";

interface MembershipForm {
  issuer: string;
}

interface ShareForm {
  certificateId: string;
  verifier: string;
  fields: string;
}

export const HolderDashboard = () => {
  const { address } = useAccount();
  const { data: certificates } = useHolderCertificates(
    address as `0x${string}`
  );
  const { writeContract } = useCertifyWrites();
  const { data: walletClient } = useWalletClient();
  const [lastProof, setLastProof] = useState<string | null>(null);

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

  const onMembership = membershipForm.handleSubmit(async (values) => {
    await writeContract("requestMembership", [values.issuer as `0x${string}`]);
    membershipForm.reset();
  });

  const onShare = shareForm.handleSubmit(async (values) => {
    if (!walletClient) throw new Error("Wallet client not ready");
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
    const signature = await walletClient?.signMessage({
      message: { raw: digest },
    });
    if (!signature) throw new Error("Unable to create ZK proof signature");
    const encryptedPayloadCid = await uploadJson({
      payload,
      sharedAt: Date.now(),
      signature,
    });
    await writeContract("shareCertificate", [
      BigInt(values.certificateId),
      values.verifier as `0x${string}`,
      queryHash,
      encryptedPayloadCid,
    ]);
    setLastProof(signature);
    shareForm.reset();
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Holder Workspace</h2>
        <p className="text-sm text-slate-300">
          Kelola akses sertifikat dan selective disclosure.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={onMembership}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Join Issuer</h3>
          <input
            className="input"
            placeholder="Issuer address"
            {...membershipForm.register("issuer", { required: true })}
          />
          <button className="btn-primary">Request Access</button>
        </form>

        <form
          onSubmit={onShare}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
        >
          <h3 className="font-semibold">Share Certificate</h3>
          <input
            className="input"
            placeholder="Certificate ID"
            {...shareForm.register("certificateId", { required: true })}
          />
          <input
            className="input"
            placeholder="Verifier address"
            {...shareForm.register("verifier", { required: true })}
          />
          <textarea
            className="input min-h-[120px]"
            placeholder='{"field":"value"}'
            {...shareForm.register("fields", { required: true })}
          />
          <button className="btn-secondary">Share Selectively</button>
          {lastProof && (
            <p className="text-xs text-slate-400 break-all">
              Latest selective disclosure proof signature:
              <br />
              {lastProof}
            </p>
          )}
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Certificates</h3>
        <div className="grid gap-4">
          {certificates?.map((certificate) => (
            <CertificateCard
              key={certificate.id.toString()}
              certificate={certificate}
            />
          )) || <p className="text-sm text-slate-400">Belum ada sertifikat.</p>}
        </div>
      </div>
    </section>
  );
};
