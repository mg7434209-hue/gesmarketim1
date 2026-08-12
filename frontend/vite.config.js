import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Çıktı repo kökündeki dist/'e gider; server.js SPA'yı oradan servis eder
// (dist commit edilir — Railway'de node build'i gerekmez).
export default defineConfig({
  plugins: [react()],
  build: { outDir: "../dist", emptyOutDir: true },
  server: { proxy: { "/api": "http://127.0.0.1:3001", "/public": "http://127.0.0.1:3001" } }
});
