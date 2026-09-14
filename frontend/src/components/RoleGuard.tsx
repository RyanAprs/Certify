import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, Lock, ArrowLeft } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { isContractConfigured } from "../lib/contract";
import { Notice, Spinner } from "./Shared";

type RequiredRole = "issuer" | "holder" | "verifier";

const LABELS: Record<RequiredRole, string> = {
  issuer: "Issuer",
  holder: "Holder",
  verifier: "Verifier",
};

function Gate({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="panel-pad animate-scale-in flex flex-col items-center gap-5 text-center">
        {children}
      </div>
    </div>
  );
}

export const RoleGuard = ({
  role,
  children,
}: {
  role: RequiredRole;
  children: ReactNode;
}) => {
  const { isConnected, isIssuer, isAdmin, roleLoading } = useRole();

  if (!isContractConfigured()) {
    return (
      <div className="mx-auto max-w-lg">
        <Notice tone="warning" title="Contract not configured">
          The registry address is empty. Deploy the contracts with{" "}
          <code>npm run deploy:local</code> inside <code>contracts/</code> — it
          writes <code>deployment.json</code> — then reload.
        </Notice>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Gate>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-tint text-primary">
          <Wallet size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">
            Connect your wallet
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            The {LABELS[role]} workspace signs actions with your wallet on the
            Hardhat network (chain 31337).
          </p>
        </div>
        <ConnectButton />
      </Gate>
    );
  }

  if (role === "issuer") {
    if (roleLoading) {
      return (
        <Gate>
          <Spinner label="Checking issuer authorization…" />
        </Gate>
      );
    }
    if (!isIssuer && !isAdmin) {
      return (
        <Gate>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-danger-tint text-danger-ink">
            <Lock size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">
              Not a registered issuer
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              This wallet can't issue certificates yet. The registry admin must
              call <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.8em]">registerIssuer(yourAddress)</code>{" "}
              to authorize you.
            </p>
          </div>
          <Link to="/" className="btn-ghost">
            <ArrowLeft size={16} aria-hidden="true" /> Back to overview
          </Link>
        </Gate>
      );
    }
  }

  return <>{children}</>;
};
