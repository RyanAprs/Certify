import { Link } from "react-router-dom";
import { useRole } from "../context/RoleContext";

interface RoleGuardProps {
  requiredRole: "issuer";
  children: React.ReactNode;
}

export const RoleGuard = ({ requiredRole, children }: RoleGuardProps) => {
  const { isIssuer, roleLoading } = useRole();

  if (roleLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-slate-400">Memeriksa akses...</p>
      </div>
    );
  }

  if (requiredRole === "issuer" && !isIssuer) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚫</span>
          <div>
            <h2 className="text-lg font-bold text-red-300">Akses Ditolak</h2>
            <p className="text-sm text-red-400">
              Halaman ini hanya dapat diakses oleh Issuer yang terdaftar.
              Address Anda belum terdaftar sebagai Issuer di smart contract.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Hubungi admin sistem untuk mendaftarkan address Anda sebagai Issuer.
        </p>
        <Link
          to="/"
          className="inline-block rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition-colors"
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
