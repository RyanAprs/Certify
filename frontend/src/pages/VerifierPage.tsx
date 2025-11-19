import { VerifierDashboard } from "../components/VerifierDashboard";
import { AuthGuard } from "../components/AuthGuard";

export const VerifierPage = () => (
  <AuthGuard>
    <VerifierDashboard />
  </AuthGuard>
);
