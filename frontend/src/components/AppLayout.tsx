import { Link, NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Stamp, GraduationCap, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { useRole } from "../context/RoleContext";
import { useMemberRequests } from "../hooks/useMemberRequests";
import { useT, Lang } from "../lib/i18n";

const roleLinks = [
  { to: "/issuer", key: "nav.issuer", Icon: Stamp, issuerOnly: true },
  { to: "/holder", key: "nav.holder", Icon: GraduationCap, issuerOnly: false },
  { to: "/verifier", key: "nav.verifier", Icon: ShieldCheck, issuerOnly: false },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isIssuer, isAdmin, isConnected } = useRole();
  const { address } = useAccount();
  const { t, lang, setLang } = useT();
  const canIssue = isIssuer || isAdmin;

  const { data: requests } = useMemberRequests(canIssue ? address : undefined);
  const pendingCount = requests?.pending.length ?? 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-[1100] border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Certify home">
            <img
              src="/logo.png"
              alt=""
              className="h-28 w-28 rounded-lg object-contain"
            />
            <span className="leading-none">
              <span className="block font-serif text-lg font-semibold tracking-tight text-ink">
                Certify
              </span>
              {/* <span className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-subtle">
                {t("brand.subtitle")}
              </span> */}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Language">
              {(["en", "id"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={clsx(
                    "rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors",
                    lang === l ? "bg-primary text-white" : "text-ink-subtle hover:text-ink"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <ConnectButton accountStatus="address" showBalance={false} chainStatus="icon" />
          </div>
        </div>

        {isConnected && (
          <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 sm:px-6" aria-label="Workspaces">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                clsx(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "border-primary text-ink" : "border-transparent text-ink-subtle hover:text-ink"
                )
              }
            >
              {t("nav.home")}
            </NavLink>
            {roleLinks
              .filter((l) => !l.issuerOnly || canIssue)
              .map(({ to, key, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "border-primary text-ink" : "border-transparent text-ink-subtle hover:text-ink"
                    )
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  {t(key)}
                  {to === "/issuer" && pendingCount > 0 && (
                    <span
                      className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-bold leading-none text-white"
                      aria-label={`${pendingCount} pending`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl animate-fade-up px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="mt-8 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt=""
              className="h-28 w-28 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <span className="block font-serif text-sm font-semibold text-ink">Certify</span>
              {/* <span className="block text-xs text-ink-subtle">{t("brand.subtitle")}</span> */}
            </div>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-ink-subtle">
            {t("footer.note")}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
