import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import vitePluginImp from "vite-plugin-imp";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
    vitePluginImp({
      libList: [
        {
          libName: "antd",
          style: (name) => `antd/es/${name}/style/index.js`,
        },
      ],
    }),
  ],

  build: {
    sourcemap: false, // reduces memory use during build
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "antd-vendor": ["antd"],
          "chart-vendor": ["apexcharts", "react-apexcharts"],
        },
      },
    },
  },

  server: {
    host: "localhost",
    port: 3000,
    proxy: {
      "/api": {
        target: "https://hikeapi.tripways.et",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/socket.io": {
        target: "https://hikeapi.tripways.et",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/uploads": {
        target: "https://hikeapi.tripways.et",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  optimizeDeps: {
    exclude: [
      "antd",
      "@ant-design/icons",
      "rc-cascader",
      "rc-picker",
      "rc-table",
      "rc-tree",
    ],
  },
});

