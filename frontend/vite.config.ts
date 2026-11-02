// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, and tailwindcss,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, UserConfig } from "vite";

const defineConfig = defineLovableConfig({
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

export default async (env: ConfigEnv): Promise<UserConfig> => {
  const config = await defineConfig(env);
  const plugins = config.plugins?.filter((plugin) => {
    return typeof plugin !== "object" || plugin === null || !("name" in plugin) || plugin.name !== "vite-tsconfig-paths";
  });

  return {
    ...config,
    ...(plugins ? { plugins } : {}),
  };
};
