import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Stamp, GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { useT } from "../lib/i18n";

const flow = [
  { Icon: Stamp, roleKey: "nav.issuer", bodyKey: "landing.flow.issuer" },
  { Icon: GraduationCap, roleKey: "nav.holder", bodyKey: "landing.flow.holder" },
  { Icon: ShieldCheck, roleKey: "nav.verifier", bodyKey: "landing.flow.verifier" },
];

export const LandingPage = () => {
  const { isConnected, isIssuer, isAdmin } = useRole();
  const { t } = useT();
  const canIssue = isIssuer || isAdmin;

  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
          {t("landing.eyebrow")}
        </p>
        <h1 className="mt-3 text-balance font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
          {t("landing.title")}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-muted">
          {t("landing.subtitle")}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {!isConnected ? (
            <ConnectButton />
          ) : (
            <>
              {canIssue && (
                <Link to="/issuer" className="btn-primary">
                  <Stamp size={16} aria-hidden="true" /> {t("landing.goIssuer")}
                </Link>
              )}
              <Link to="/holder" className={canIssue ? "btn-secondary" : "btn-primary"}>
                <GraduationCap size={16} aria-hidden="true" /> {t("landing.goHolder")}
              </Link>
              <Link to="/verifier" className="btn-secondary">
                <ShieldCheck size={16} aria-hidden="true" /> {t("landing.goVerifier")}
              </Link>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-6 font-serif text-xl font-semibold text-ink">
          {t("landing.howTitle")}
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {flow.map(({ Icon, roleKey, bodyKey }, i) => (
            <li key={roleKey} className="relative flex flex-col gap-3 bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-tint text-primary">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="font-mono text-sm text-ink-subtle">
                  {t("landing.step")} {i + 1}
                </span>
                {i < flow.length - 1 && (
                  <ArrowRight size={16} className="ml-auto hidden text-ink-subtle md:block" aria-hidden="true" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-ink">{t(roleKey)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(bodyKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
