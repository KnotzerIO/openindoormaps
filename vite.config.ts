import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["map-gl-indoor"],
  },
  build: {
    commonjsOptions: {
      include: [/map-gl-indoor/, /node_modules/],
    },
  },
  resolve: {
    alias: {
      "map-gl-indoor": "node_modules/map-gl-indoor/dist/map-gl-indoor.es.js",
    },
  },
  ssr: {
    noExternal: ["maplibre-gl", "@maplibre/*"],
  },
});
