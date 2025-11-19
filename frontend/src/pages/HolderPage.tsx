import { HolderDashboard } from "../components/HolderDashboard";
import { AuthGuard } from "../components/AuthGuard";

export const HolderPage = () => (
  <AuthGuard>
    <HolderDashboard />
  </AuthGuard>
);
