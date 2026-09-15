import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalance } from "wagmi";
import { Wallet, Lock, ArrowLeft, Fuel, RefreshCw } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { isContractConfigured } from "@/lib/contract";
import { useT } from "@/lib/i18n";
import { Notice, Spinner } from "@/components/Shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RequiredRole = "issuer" | "holder" | "verifier";

function Gate({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <Card className="animate-scale-in flex flex-col items-center gap-5 p-6 text-center sm:p-8">
        {children}
      </Card>
    </div>
  );
}

function GateIcon({
  tone,
  children,
}: {
  tone: "primary" | "pending" | "danger";
  children: ReactNode;
}) {
  const tones = {
    primary: "bg-primary-tint text-primary",
    pending: "bg-pending-tint text-pending-ink",
    danger: "bg-danger-tint text-danger-ink",
  } as const;
  return (
    <span className={`grid h-12 w-12 place-items-center rounded-xl ${tones[tone]}`}>
      {children}
    </span>
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
        <GateIcon tone="primary">
          <Wallet size={22} aria-hidden="true" />
        </GateIcon>
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
        <GateIcon tone="pending">
          <Fuel size={22} aria-hidden="true" />
        </GateIcon>
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink">
            {t("guard.noFunds.title")}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{t("guard.noFunds.body")}</p>
        </div>
        <Button variant="secondary" onClick={() => refetchBalance()}>
          <RefreshCw size={16} aria-hidden="true" /> {t("guard.retry")}
        </Button>
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
          <GateIcon tone="danger">
            <Lock size={22} aria-hidden="true" />
          </GateIcon>
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">
              {t("guard.denied.title")}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{t("guard.denied.body")}</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft size={16} aria-hidden="true" /> {t("common.back")}
            </Link>
          </Button>
        </Gate>
      );
    }
  }

  return <>{children}</>;
};
