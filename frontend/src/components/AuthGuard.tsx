import { useAuth } from "../context/AuthContext";
import { DevLogin } from "./DevLogin";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { address, loading } = useAuth();

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-slate-400">Checking session...</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
          <p className="text-sm text-yellow-200">
            ⚠️ Silakan connect wallet atau gunakan mode developer untuk
            melanjutkan.
          </p>
        </div>

        <DevLogin />
      </div>
    );
  }

  return <>{children}</>;
};
