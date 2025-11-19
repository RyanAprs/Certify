import { IssuerDashboard } from "../components/IssuerDashboard";
import { AuthGuard } from "../components/AuthGuard";

export const IssuerPage = () => (
  <AuthGuard>
    <IssuerDashboard />
  </AuthGuard>
);
