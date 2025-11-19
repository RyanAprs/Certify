import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import App from "./pages/App";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();
const projectId = import.meta.env.VITE_WALLETCONNECT_ID ?? "demo";

const { connectors } = getDefaultWallets({
  appName: "Certify",
  projectId,
  chains: [sepolia],
});

const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_RPC_URL),
  },
  connectors,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
