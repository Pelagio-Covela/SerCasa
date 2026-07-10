import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // diferente do Front-end (5173), para rodar os dois ao mesmo tempo
  },
});
