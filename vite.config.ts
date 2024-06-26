import { defineConfig, loadEnv } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";

export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  // import.meta.env.VITE_NAME available here with: process.env.VITE_NAME
  // import.meta.env.VITE_PORT available here with: process.env.VITE_PORT

  return defineConfig({
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    plugins: [
      react(),
      mode !== "chrome"
        ? electron({
            main: {
              // Shortcut of `build.lib.entry`.
              entry: "electron/main.ts",
            },
            preload: {
              // Shortcut of `build.rollupOptions.input`.
              // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
              input: path.join(__dirname, "electron/preload.ts"),
            },
            // Ployfill the Electron and Node.js API for Renderer process.
            // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
            // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
            renderer:
              process.env.NODE_ENV === "test"
                ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
                  undefined
                : {},
          })
        : undefined,
    ],
  });
};
