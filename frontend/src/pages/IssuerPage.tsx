import { IssuerDashboard } from "../components/IssuerDashboard";
import { AuthGuard } from "../components/AuthGuard";
import { RoleGuard } from "../components/RoleGuard";

export const IssuerPage = () => (
  <AuthGuard>
    <RoleGuard requiredRole="issuer">
      <IssuerDashboard />
    </RoleGuard>
  </AuthGuard>
);
