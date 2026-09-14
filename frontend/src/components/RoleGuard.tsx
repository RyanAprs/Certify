import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalance } from "wagmi";
import { Wallet, Lock, ArrowLeft, Fuel, RefreshCw } from "lucide-react";
import { useRole } from "../context/RoleContext";
import { isContractConfigured } from "../lib/contract";
import { useT } from "../lib/i18n";
import { Notice, Spinner } from "./Shared";

type RequiredRole = "issuer" | "holder" | "verifier";

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
  const { isConnected, isIssuer, isAdmin, roleLoading, address } = useRole();
  const { t } = useT();
  const {
    data: balance,
    isLoading: balLoading,
    refetch: refetchBalance,
  } = useBalance({ address, query: { enabled: Boolean(address) } });

  if (!isContractConfigured()) {
    return (
      <div className="mx-auto max-w-lg">
        <Notice tone="warning" title={t("guard.notConfigured.title")}>
          {t("guard.notConfigured.body")}
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
            {t("landing.connectPrompt")}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("guard.connect", { role: t(`nav.${role}`) })}
          </p>
        </div>
        <ConnectButton />
      </Gate>
    );
  }

  // Connected but the wallet can't pay gas on this chain.
  if (balLoading) {
    return (
      <Gate>
        <Spinner label={t("common.loading")} />
      </Gate>
    );
  }
  if (balance && balance.value === 0n) {
    return (
      <Gate>
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-pending-tint text-pending-ink">
          <Fuel size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">
            {t("guard.noFunds.title")}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{t("guard.noFunds.body")}</p>
        </div>
        <button onClick={() => refetchBalance()} className="btn-secondary">
          <RefreshCw size={16} aria-hidden="true" /> {t("guard.retry")}
        </button>
      </Gate>
    );
  }

  if (role === "issuer") {
    if (roleLoading) {
      return (
        <Gate>
          <Spinner label={t("guard.checkingIssuer")} />
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
              {t("guard.denied.title")}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{t("guard.denied.body")}</p>
          </div>
          <Link to="/" className="btn-ghost">
            <ArrowLeft size={16} aria-hidden="true" /> {t("common.back")}
          </Link>
        </Gate>
      );
    }
  }

  return <>{children}</>;
};
