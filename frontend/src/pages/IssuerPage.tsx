import { IssuerDashboard } from "../components/IssuerDashboard";
import { RoleGuard } from "../components/RoleGuard";

export const IssuerPage = () => (
  <RoleGuard role="issuer">
    <IssuerDashboard />
  </RoleGuard>
);
