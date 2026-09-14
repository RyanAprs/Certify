import { HolderDashboard } from "../components/HolderDashboard";
import { RoleGuard } from "../components/RoleGuard";

export const HolderPage = () => (
  <RoleGuard role="holder">
    <HolderDashboard />
  </RoleGuard>
);
