import { useForm } from "react-hook-form";
import { useIssuerCertificates } from "../hooks/useCertificates";
import { useCertifyWrites } from "../hooks/useCertifyContract";
import { CertificateCard } from "./Shared";
import { uploadFile, uploadJson } from "../lib/ipfs";
import { keccak256, toBytes } from "viem";
import { useAccount } from "wagmi";

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
  const { address } = useAccount();
  const { data: certificates, refetch } = useIssuerCertificates(
    address as `0x${string}`
  );
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
  const { writeContract, isPending } = useCertifyWrites();

  const onIssue = issueForm.handleSubmit(async (values) => {
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
    await writeContract("issueCertificate", [
      values.holder as `0x${string}`,
      metadataCid,
      metadataCommitment,
    ]);
    issueForm.reset();
    refetch();
  });

  const onMemberDecision = decisionForm.handleSubmit(async (values) => {
    await writeContract("manageMember", [
      values.holder as `0x${string}`,
      values.approve,
    ]);
    decisionForm.reset();
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Issuer Workspace</h2>
        <p className="text-sm text-slate-300">
          Terbitkan sertifikat + unggah image ke IPFS dan kelola holder.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={onIssue}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
        >
          <h3 className="font-semibold">Create Certificate</h3>
          <input
            className="input"
            placeholder="Holder Address"
            {...issueForm.register("holder", { required: true })}
          />
          <input
            className="input"
            placeholder="Nama"
            {...issueForm.register("name", { required: true })}
          />
          <input
            className="input"
            placeholder="Institusi"
            {...issueForm.register("institution", { required: true })}
          />
          <input
            className="input"
            placeholder="Program Studi"
            {...issueForm.register("program", { required: true })}
          />
          <input
            className="input"
            placeholder="GPA"
            {...issueForm.register("gpa", { required: true })}
          />
          <textarea
            className="input min-h-[80px]"
            placeholder="Deskripsi"
            {...issueForm.register("description", { required: true })}
          />
          <label className="text-sm text-slate-400">
            Upload Certificate Image (PNG/JPEG)
          </label>
          <input
            className="input"
            type="file"
            accept="image/*"
            {...issueForm.register("image", { required: true })}
          />
          <button disabled={isPending} className="btn-primary">
            {isPending ? "Processing..." : "Issue"}
          </button>
        </form>

        <form
          onSubmit={onMemberDecision}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3"
        >
          <h3 className="font-semibold">Manage Members</h3>
          <input
            className="input"
            placeholder="Holder Address"
            {...decisionForm.register("holder", { required: true })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...decisionForm.register("approve")} />{" "}
            Approve request
          </label>
          <button className="btn-secondary">Submit Decision</button>
        </form>
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
          {certificates?.map((certificate) => (
            <CertificateCard
              key={certificate.id.toString()}
              certificate={certificate}
            />
          )) || <p className="text-sm text-slate-400">No certificates yet.</p>}
        </div>
      </div>
    </section>
  );
};
