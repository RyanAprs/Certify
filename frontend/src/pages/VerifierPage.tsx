import { VerifierDashboard } from "../components/VerifierDashboard";
import { RoleGuard } from "../components/RoleGuard";

export const VerifierPage = () => (
  <RoleGuard role="verifier">
    <VerifierDashboard />
  </RoleGuard>
);
