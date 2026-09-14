import { useForm } from "react-hook-form";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isAddress, keccak256, parseAbiItem, toBytes } from "viem";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { GraduationCap, UserPlus, Share2, BadgeCheck, FileText, Check } from "lucide-react";
import clsx from "clsx";

import { useHolderCertificates } from "../hooks/useCertificates";
import { useRegistryWrite } from "../hooks/useRegistryWrite";
import {
  CertificateCard,
  DataChip,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  Spinner,
  SkeletonCard,
} from "./Shared";
import { uploadJson, fetchFromIpfs } from "../lib/ipfs";
import { publicClient, registryContract, deploymentBlock } from "../lib/contract";
import { getSchema } from "../lib/schemas";
import { CredentialMetadata } from "../lib/zkp";
import { useT } from "../lib/i18n";

interface MembershipForm {
  issuer: string;
}

interface DiscloseField {
  key: string;
  label: string;
  value: string;
}

function useMemberships(holder?: `0x${string}`) {
  return useQuery({
    enabled: Boolean(holder),
    queryKey: ["memberships", holder],
    queryFn: async () => {
      if (!holder) return [] as string[];
      const logs = await publicClient.getLogs({
        address: registryContract.address,
        event: parseAbiItem(
          "event MemberDecision(address indexed issuer, address indexed holder, bool approved)"
        ),
        args: { holder },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });
      return [
        ...new Set(
          logs.filter((l) => l.args.approved).map((l) => l.args.issuer as string)
        ),
      ];
    },
  });
}

export const HolderDashboard = () => {
  const { address } = useAccount();
  const { data: certificates, isLoading: certsLoading } =
    useHolderCertificates(address);
  const { data: memberships } = useMemberships(address);
  const { write } = useRegistryWrite();
  const { t, tt } = useT();

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const membershipForm = useForm<MembershipForm>({ defaultValues: { issuer: "" } });

  /* ---------- Share panel state ---------- */
  const [shareId, setShareId] = useState("");
  const [verifierAddr, setVerifierAddr] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const shareCert = certificates?.find((c) => c.id.toString() === shareId);
  const shareSchema = shareCert ? getSchema(shareCert.schemaId) : undefined;

  const { data: shareMeta, isLoading: metaLoading } = useQuery({
    enabled: Boolean(shareCert?.metadataCid),
    queryKey: ["shareMeta", shareCert?.metadataCid],
    queryFn: () => fetchFromIpfs<CredentialMetadata>(shareCert!.metadataCid),
  });

  const fields = useMemo<DiscloseField[]>(() => {
    if (!shareMeta) return [];
    const out: DiscloseField[] = [];
    const push = (key: string, label: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== "")
        out.push({ key, label, value: String(value) });
    };
    push("name", "Name", shareMeta.name);
    push("institution", "Institution", shareMeta.institution);
    push(
      "program",
      shareSchema?.display.find((d) => d.key === "program")?.label ?? "Program",
      shareMeta.program
    );
    push("description", "Description", shareMeta.description);
    shareSchema?.claims.forEach((f) => {
      const v = shareMeta.claims?.[f.key];
      if (v !== undefined)
        push(
          f.key,
          f.label,
          f.kind === "timestamp"
            ? new Date(Number(v) * 1000).toLocaleDateString()
            : v
        );
    });
    return out;
  }, [shareMeta, shareSchema]);

  // Default-select the non-sensitive identity fields when a credential loads.
  useEffect(() => {
    if (!shareMeta) return;
    setSelected(new Set(["name", "institution", "program"]));
  }, [shareMeta]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const onMembership = membershipForm.handleSubmit(async (values) => {
    setIsRequesting(true);
    try {
      await write("requestMembership", [values.issuer as `0x${string}`], {
        pending: t("op.requesting"),
        success: t("op.requested"),
      });
      membershipForm.reset();
    } catch {
      /* toast shown */
    } finally {
      setIsRequesting(false);
    }
  });

  const onShare = async () => {
    if (!shareCert) return toast.error(t("err.selectCred"));
    if (!isAddress(verifierAddr)) return toast.error(t("valid.verifierReq"));
    const chosen = fields.filter((f) => selected.has(f.key));
    if (chosen.length === 0) return toast.error(t("err.selectField"));

    setIsSharing(true);
    try {
      const disclosed = Object.fromEntries(chosen.map((f) => [f.key, f.value]));
      const queryHash = keccak256(toBytes(JSON.stringify(disclosed)));
      const cid = await toast.promise(
        uploadJson({
          certificateId: shareCert.id.toString(),
          type: shareMeta?.type,
          disclosed,
          sharedAt: new Date().toISOString(),
        }),
        { loading: t("op.uploadingDisc"), success: t("op.uploaded"), error: t("op.uploadFailed") }
      );
      await write(
        "shareCertificate",
        [shareCert.id, verifierAddr as `0x${string}`, queryHash, cid],
        { pending: t("op.sharing"), success: t("op.shared") }
      );
      setVerifierAddr("");
    } catch (err: any) {
      if (err?.message) toast.error(err.message);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section>
      <PageHeader
        icon={<GraduationCap size={22} aria-hidden="true" />}
        eyebrow={t("workspace")}
        title={t("nav.holder")}
        description={t("holder.desc")}
        aside={address ? <DataChip label={t("signedIn")} value={address} /> : undefined}
      />

      {memberships && memberships.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-valid/25 bg-valid-tint px-4 py-3">
          <BadgeCheck size={16} className="text-valid-ink" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">{t("holder.memberOf")}</span>
          {memberships.map((m) => (
            <DataChip key={m} value={m} />
          ))}
        </div>
      )}

      {/* Join issuer */}
      <form onSubmit={onMembership} className="panel-pad mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-ink">{t("join.title")}</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <input
              className="input-mono"
              placeholder={t("join.placeholder")}
              disabled={isRequesting}
              {...membershipForm.register("issuer", {
                required: t("valid.issuerReq"),
                validate: (v) => isAddress(v) || t("valid.addr"),
              })}
            />
            {membershipForm.formState.errors.issuer && (
              <p className="mt-1.5 text-xs text-danger-ink">
                {membershipForm.formState.errors.issuer.message}
              </p>
            )}
          </div>
          <button className="btn-primary sm:w-44" disabled={isRequesting}>
            <UserPlus size={16} aria-hidden="true" />
            {isRequesting ? t("join.requesting") : t("join.request")}
          </button>
        </div>
      </form>

      {/* Share panel */}
      <div className="panel-pad space-y-5">
        <div className="flex items-center gap-2">
          <Share2 size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-ink">{t("share.title")}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("share.credential")}>
            <select
              className="input"
              value={shareId}
              onChange={(e) => setShareId(e.target.value)}
            >
              <option value="">{t("share.select")}</option>
              {certificates?.map((c) => {
                const s = getSchema(c.schemaId);
                return (
                  <option key={c.id.toString()} value={c.id.toString()}>
                    №{c.id.toString().padStart(4, "0")} · {s?.label ?? "Credential"}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label={t("share.verifier")}>
            <input
              className="input-mono"
              placeholder="0x…"
              value={verifierAddr}
              onChange={(e) => setVerifierAddr(e.target.value)}
            />
          </Field>
        </div>

        {!shareCert ? (
          <p className="text-sm text-ink-subtle">
            Pick one of your credentials to choose which fields to disclose.
          </p>
        ) : metaLoading ? (
          <Spinner label={t("load.fields")} />
        ) : (
          <>
            <div>
              <span className="label">{t("share.fields")}</span>
              <div className="flex flex-wrap gap-2">
                {fields.map((f) => {
                  const on = selected.has(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggle(f.key)}
                      aria-pressed={on}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition",
                        on
                          ? "border-primary bg-primary-tint text-ink"
                          : "border-line-strong text-ink-muted hover:border-primary/40"
                      )}
                    >
                      <span
                        className={clsx(
                          "grid h-4 w-4 place-items-center rounded border",
                          on ? "border-primary bg-primary text-white" : "border-line-strong"
                        )}
                        aria-hidden="true"
                      >
                        {on && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="font-medium">{tt(`field.${f.key}`, f.label)}</span>
                      <span className="max-w-[10rem] truncate text-ink-subtle">{f.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Notice tone="info">{t("share.notice")}</Notice>

            <button className="btn-primary w-full sm:w-auto" onClick={onShare} disabled={isSharing}>
              <Share2 size={16} aria-hidden="true" />
              {isSharing ? t("share.sharing") : t(selected.size === 1 ? "share.submit_one" : "share.submit", { n: selected.size })}
            </button>
          </>
        )}
      </div>

      {/* Certificates */}
      <div className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">{t("creds.title")}</h2>
        {certsLoading ? (
          <div className="grid gap-5 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {certificates.map((c) => (
              <CertificateCard key={c.id.toString()} certificate={c} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<FileText size={28} />} title={t("creds.empty")}>
            Once an issuer you've joined grants you a certificate, it will appear
            here — ready to share.
          </EmptyState>
        )}
      </div>
    </section>
  );
};
