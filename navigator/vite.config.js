import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// L'app gira su 5174 per non collidere con il server Express (3000)
// né con un eventuale dev server del marketplace.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
    // Senza strictPort, se la 5174 è occupata Vite scivola sulla porta
    // successiva — e si porta via quella del Marketplace. Meglio un errore
    // esplicito che due app che si scambiano di posto.
    strictPort: true,
    open: true,
  },
});
