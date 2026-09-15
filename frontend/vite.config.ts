import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  define: {
    global: "globalThis"
  },
  resolve: {
    alias: {
      buffer: "buffer",
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
