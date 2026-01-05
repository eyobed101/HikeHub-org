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
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd'],
          'chart-vendor': ['apexcharts', 'react-apexcharts'],
        },
      },
    },
  },
  server: {
    host: 'localhost',          // Ensure it runs on localhost
    port: 3000,                 // Optional: Custom port
    allowedHosts: [
      "a556f3900a29.ngrok-free.app",      // ← your ngrok domain
      "5e701cc01a2b.ngrok-free.app"  // ← if you use this too
    ],
    proxy: {
      '/api': {
        // target: 'https://hikeapi.tripways.et',
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying for Socket.IO
      },
      '/socket.io': {
        // target: 'https://hikeapi.tripways.et',
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying for Socket.IO
      },
      '/uploads': {
        // target: 'https://hikeapi.tripways.et',
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
