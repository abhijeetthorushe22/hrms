import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  // Determine if we're in development or production
  const isDev = mode === "development";
  const isProd = mode === "production";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "./src"
        ),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
    },
    define: {
      // Make env variables available to the app
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || "AuraHR"),
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || "1.0.0"),
      __DEV_MODE__: env.VITE_DEV_MODE === "true",
    },
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: env.VITE_HOST || "localhost",
      open: isDev,
      cors: true,
      proxy: {
        "/api": {
          target:
            env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "Sending Request to the Target:",
                req.method,
                req.url
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "Received Response from the Target:",
                proxyRes.statusCode,
                req.url
              );
            });
          },
        },
        "/uploads": {
          target:
            env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: isDev || env.VITE_BUILD_SOURCEMAP === "true",
      minify: isProd ? "esbuild" : false,
      target: "es2015",
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            "react-vendor": ["react", "react-dom"],
            "router-vendor": ["react-router-dom"],
            "ui-vendor": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-select",
            ],
            "query-vendor": ["@tanstack/react-query"],
            "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
            "chart-vendor": ["recharts"],
            "utils-vendor": ["axios", "date-fns", "clsx", "tailwind-merge"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      // Enable bundle analyzer in development if flag is set
      ...(isDev &&
        env.VITE_ENABLE_BUNDLE_ANALYZER === "true" && {
          rollupOptions: {
            plugins: [
              // Bundle analyzer would go here if added as dependency
            ],
          },
        }),
    },
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_HOST || "localhost",
      cors: true,
    },
    css: {
      devSourcemap: isDev,
      postcss: "./postcss.config.js",
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@tanstack/react-query",
        "axios",
        "zustand",
      ],
    },
    esbuild: {
      drop: isProd ? ["console", "debugger"] : [],
    },
  };
});
