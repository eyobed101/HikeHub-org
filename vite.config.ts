import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    https: {
      key: './cert.key',         // Path to your private key
      cert: './cert.crt'        // Path to your certificate
    },
    host: 'localhost',          // Ensure it runs on localhost
    port: 3000                  // Optional: Custom port
  }
});
