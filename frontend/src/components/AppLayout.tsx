import { Link, NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const links = [
  { to: "/issuer", label: "Issuer" },
  { to: "/holder", label: "Holder" },
  { to: "/verifier", label: "Verifier" },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-950 text-white">
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/"
            className="text-sm uppercase tracking-widest text-secondary"
          >
            CERTIFY
          </Link>
          <h1 className="text-3xl font-bold">
            Blockchain Academic Credentialing
          </h1>
          <p className="text-slate-300">ZKP + IPFS + React + Solidity</p>
        </div>
        <ConnectButton
          accountStatus="address"
          showBalance={false}
          chainStatus="name"
        />
      </header>

      <nav className="flex flex-wrap gap-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `rounded-full px-5 py-2 text-sm font-semibold ${
              isActive
                ? "bg-secondary text-slate-950"
                : "bg-slate-800 text-slate-300"
            }`
          }
          end
        >
          Beranda
        </NavLink>
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-full px-5 py-2 text-sm font-semibold ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-300"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {children}
    </div>
  </div>
);

export default AppLayout;
