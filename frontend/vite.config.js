const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

const backendTarget = process.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";
const frontendPort = Number(process.env.CLIENT_PORT || 5173);

module.exports = defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: frontendPort,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true
      },
      "/health": {
        target: backendTarget,
        changeOrigin: true
      }
    }
  }
});
