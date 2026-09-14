import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRole } from "../context/RoleContext";

export const LandingPage = () => {
  const { isConnected, isIssuer, isAdmin } = useRole();
  const canIssue = isIssuer || isAdmin;

  return (
    <section className="space-y-8 text-center">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-secondary">
          Certify
        </p>
        <h1 className="text-4xl font-bold">
          On-Chain Academic Certificate Verification
        </h1>
        <p className="mx-auto max-w-2xl text-slate-300">
          A blockchain + ZKP platform for issuing, storing, and verifying
          academic credentials with strong privacy (selective disclosure of GPA
          without revealing the exact value).
        </p>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-slate-400">Connect your wallet to get started.</p>
          <ConnectButton />
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {canIssue && (
            <Link className="btn-primary max-w-xs" to="/issuer">
              Go to Issuer workspace
            </Link>
          )}
          <Link className="btn-secondary max-w-xs" to="/holder">
            Go to Holder workspace
          </Link>
          <Link className="btn-secondary max-w-xs" to="/verifier">
            Go to Verifier workspace
          </Link>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-4 pt-6 text-left md:grid-cols-3">
        <RoleCard
          title="Issuer"
          body="Registered institutions approve holders and issue certificates with an on-chain commitment."
        />
        <RoleCard
          title="Holder"
          body="Request membership, receive certificates, and share selectively with a zero-knowledge GPA proof."
        />
        <RoleCard
          title="Verifier"
          body="Look up a certificate and verify a GPA-threshold proof on-chain without seeing the actual GPA."
        />
      </div>
    </section>
  );
};

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{body}</p>
    </div>
  );
}
