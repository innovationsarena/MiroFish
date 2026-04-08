import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@locales": path.resolve(__dirname, "../locales"),
    },
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
    fs: {
      allow: [
        // Allow access to shared locales directory above frontend root
        path.resolve(__dirname, ".."),
      ],
    },
    proxy: {
      "/api": {
        target: "http://0.0.0.0:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
