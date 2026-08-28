import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 43417,
    host: true,
    // The preview reaches the dev server through a proxy host.
    allowedHosts: true,
  },
  preview: {
    port: 43417,
    host: true,
    allowedHosts: true,
  },
  build: {
    target: "es2022",
    cssTarget: "chrome110",
    assetsInlineLimit: 2048,
  },
});
