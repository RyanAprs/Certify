import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Stamp, GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";
import { useRole } from "../context/RoleContext";

const flow = [
  {
    Icon: Stamp,
    role: "Issuer",
    body: "A registered institution approves a holder and issues a certificate, storing only a commitment on-chain.",
  },
  {
    Icon: GraduationCap,
    role: "Holder",
    body: "The student holds the credential in their wallet and shares it selectively — proving a GPA threshold, never the exact value.",
  },
  {
    Icon: ShieldCheck,
    role: "Verifier",
    body: "An employer verifies the zero-knowledge proof on-chain. The claim checks out; the underlying data stays private.",
  },
];

export const LandingPage = () => {
  const { isConnected, isIssuer, isAdmin } = useRole();
  const canIssue = isIssuer || isAdmin;

  return (
    <div className="space-y-14">
      <section className="max-w-3xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
          Zero-knowledge academic credentials
        </p>
        <h1 className="mt-3 text-balance font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
          Verify what matters. Reveal nothing else.
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-muted">
          Certify is an on-chain registry for academic credentials. Institutions
          issue, students hold, and anyone can verify a GPA threshold with a
          zero-knowledge proof — without exposing the transcript behind it.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {!isConnected ? (
            <ConnectButton />
          ) : (
            <>
              {canIssue && (
                <Link to="/issuer" className="btn-primary">
                  <Stamp size={16} aria-hidden="true" /> Issuer workspace
                </Link>
              )}
              <Link to="/holder" className={canIssue ? "btn-secondary" : "btn-primary"}>
                <GraduationCap size={16} aria-hidden="true" /> Holder workspace
              </Link>
              <Link to="/verifier" className="btn-secondary">
                <ShieldCheck size={16} aria-hidden="true" /> Verifier workspace
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How it works — a real ordered sequence, so the numbers carry meaning */}
      <section>
        <h2 className="mb-6 font-serif text-xl font-semibold text-ink">
          How a credential flows
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {flow.map(({ Icon, role, body }, i) => (
            <li key={role} className="relative flex flex-col gap-3 bg-surface p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-tint text-primary">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="font-mono text-sm text-ink-subtle">
                  Step {i + 1}
                </span>
                {i < flow.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="ml-auto hidden text-ink-subtle md:block"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-ink">{role}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
