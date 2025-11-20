import { Link, NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const links = [
  { to: "/issuer", label: "Issuer" },
  { to: "/holder", label: "Holder" },
  { to: "/verifier", label: "Verifier" },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { address, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            {/* <ConnectButton
              accountStatus="address"
              showBalance={false}
              chainStatus="name"
            /> */}
          </div>

          {address && (
            <div className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">Logged in as:</span>
                <code className="font-mono text-sm text-green-400 break-all">
                  {address}
                </code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyAddress}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={logout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </header>

        <nav className="flex flex-wrap gap-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-secondary text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                `rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
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
};

export default AppLayout;
