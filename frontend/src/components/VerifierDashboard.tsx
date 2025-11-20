import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  publicClient,
  CERTIFY_CONTRACT_ADDRESS,
  CERTIFY_ABI,
} from "../lib/viemLocal";
import { useDisclosures } from "../hooks/useCertificates";
import { keccak256, toBytes } from "viem";
import { useLocalAccount } from "../hooks/useLocalAccount";
import { walletClient } from "../lib/viemLocal";

interface VerifyForm {
  certificateId: string;
  fields: string;
  proof: string;
}

export const VerifierDashboard = () => {
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [certificateId, setCertificateId] = useState<string>("");
  const { account, address, handleSetPrivateKey } = useLocalAccount();
  const verifyForm = useForm<VerifyForm>({
    defaultValues: { certificateId: "", fields: "{}", proof: "" },
  });
  const { data: disclosures } = useDisclosures(
    certificateId ? BigInt(certificateId) : undefined
  );

  const onSearch = async () => {
    if (!certificateId) return;
    const data = await publicClient.readContract({
      address: CERTIFY_CONTRACT_ADDRESS,
      abi: CERTIFY_ABI,
      functionName: "certificates",
      args: [BigInt(certificateId)],
    });
    setSelectedCert({
      id: data[0],
      issuer: data[1],
      holder: data[2],
      metadataCid: data[3],
      metadataCommitment: data[4],
      status: data[5],
    });
    verifyForm.setValue("certificateId", certificateId);
  };

  const onVerify = verifyForm.handleSubmit(async (values) => {
    if (!account) return alert("Set private key first");
    const queryHash = keccak256(toBytes(values.fields));
    await walletClient.writeContract({
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
    verifyForm.reset();
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Verifier Workspace</h2>
        <p className="text-sm text-slate-300">
          Cari sertifikat dan jalankan verifikasi ZKP.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
        <h3 className="font-semibold">Set Private Key</h3>
        <input
          className="input w-full"
          placeholder="0x..."
          onChange={(e) => handleSetPrivateKey(e.target.value)}
        />
        {address && (
          <p className="text-sm text-green-400">Connected: {address}</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
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
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-400">Issuer</dt>
              <dd>{selectedCert.issuer}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Holder</dt>
              <dd>{selectedCert.holder}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400">CID</dt>
              <dd>
                <a
                  className="text-primary"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://ipfs.io/ipfs/${selectedCert.metadataCid}`}
                >
                  {selectedCert.metadataCid}
                </a>
              </dd>
            </div>
          </dl>
        )}
      </div>

      <form
        onSubmit={onVerify}
        className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4"
      >
        <h3 className="font-semibold">Verify Proof</h3>
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
          placeholder="0xSignature"
          {...verifyForm.register("proof", { required: true })}
        />
        <button className="btn-secondary">Verify</button>
      </form>

      <div className="space-y-3">
        <h3 className="font-semibold">Disclosures</h3>
        <ul className="space-y-3">
          {disclosures?.map((d: any) => (
            <li
              key={`${d.verifier}-${d.timestamp.toString()}`}
              className="rounded-lg border border-slate-800 p-3 text-sm"
            >
              <p>Verifier: {d.verifier}</p>
              <p>Query Hash: {d.queryHash}</p>
              <p>Encrypted CID: {d.encryptedPayloadCid}</p>
            </li>
          )) || <p className="text-sm text-slate-400">No disclosures yet.</p>}
        </ul>
      </div>
    </section>
  );
};
