import { Routes, Route } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { LandingPage } from "./Landing";
import { IssuerPage } from "./IssuerPage";
import { HolderPage } from "./HolderPage";
import { VerifierPage } from "./VerifierPage";

const App = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/issuer" element={<IssuerPage />} />
      <Route path="/holder" element={<HolderPage />} />
      <Route path="/verifier" element={<VerifierPage />} />
    </Routes>
  </AppLayout>
);

export default App;
