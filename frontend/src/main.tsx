import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import App from "./pages/App";
import { wagmiConfig } from "./lib/wagmi";
import { RoleProvider } from "./context/RoleContext";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles/index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#3d4dcc",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          <BrowserRouter>
            <RoleProvider>
              <App />
            </RoleProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "oklch(1 0 0)",
                  color: "oklch(0.24 0.02 262)",
                  border: "1px solid oklch(0.906 0.004 262)",
                  boxShadow: "0 8px 24px oklch(0.24 0.02 262 / 0.1)",
                  fontSize: "0.875rem",
                },
              }}
            />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
