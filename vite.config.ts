import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static SPA build for Netlify. No backend, no env config required.
export default defineConfig({
  plugins: [react()],
});
