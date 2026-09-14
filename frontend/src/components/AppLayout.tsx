import { Link, NavLink, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Stamp, GraduationCap, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { useRole } from "../context/RoleContext";

const roleLinks = [
  { to: "/issuer", label: "Issuer", Icon: Stamp, issuerOnly: true },
  { to: "/holder", label: "Holder", Icon: GraduationCap, issuerOnly: false },
  { to: "/verifier", label: "Verifier", Icon: ShieldCheck, issuerOnly: false },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isIssuer, isAdmin, isConnected } = useRole();
  const canIssue = isIssuer || isAdmin;
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-[1100] border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Certify home">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white shadow-xs">
              <ShieldCheck size={18} strokeWidth={2.25} aria-hidden="true" />
            </span>
            <span className="leading-none">
              <span className="block font-serif text-lg font-semibold tracking-tight text-ink">
                Certify
              </span>
              <span className="block text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-subtle">
                Credential Registry
              </span>
            </span>
          </Link>

          <ConnectButton
            accountStatus="address"
            showBalance={false}
            chainStatus="icon"
          />
        </div>

        {isConnected && (
          <nav
            className="mx-auto flex max-w-6xl items-center gap-1 px-4 sm:px-6"
            aria-label="Workspaces"
          >
            {roleLinks
              .filter((l) => !l.issuerOnly || canIssue)
              .map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary text-ink"
                        : "border-transparent text-ink-subtle hover:text-ink"
                    )
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
          </nav>
        )}
      </header>

      <main
        key={location.pathname}
        className="mx-auto max-w-6xl animate-fade-up px-4 py-8 sm:px-6 sm:py-10"
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
