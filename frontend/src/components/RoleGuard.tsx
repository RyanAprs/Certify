import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRole } from "../context/RoleContext";
import { isContractConfigured } from "../lib/contract";

type RequiredRole = "issuer" | "holder" | "verifier";

/**
 * Enforces per-page access from ON-CHAIN state instead of a self-selected
 * label. Holder/Verifier pages need only a connected wallet; the Issuer page
 * additionally requires the wallet to be a registered issuer (or admin).
 */
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
      <div className="rounded-xl border border-yellow-800 bg-yellow-900/20 p-8 space-y-2">
        <h2 className="text-lg font-bold text-yellow-200">Contract not configured</h2>
        <p className="text-sm text-yellow-300">
          The registry address is empty. Deploy the contracts with{" "}
          <code>npm run deploy:local</code> inside <code>contracts/</code> (this
          writes <code>frontend/src/lib/deployment.json</code>), then reload.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-300">
          Connect your wallet to access the {role} workspace.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (role === "issuer") {
    if (roleLoading) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Checking issuer role…</p>
        </div>
      );
    }
    if (!isIssuer && !isAdmin) {
      return (
        <div className="space-y-4 rounded-xl border border-red-800 bg-red-900/20 p-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <h2 className="text-lg font-bold text-red-300">Access denied</h2>
              <p className="text-sm text-red-400">
                This wallet is not a registered issuer. The registry admin must
                call <code>registerIssuer(yourAddress)</code> first.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-block rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
          >
            ← Back to Home
          </Link>
        </div>
      );
    }
  }

  return <>{children}</>;
};
