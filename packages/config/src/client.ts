/**
 * Public config for the Vite client bundle.
 * Values are injected at build/dev time via `__TC_PUBLIC_CONFIG__` (see apps/client/vite.config.ts).
 * Never import `@tc/config` (full server config) from client code.
 */
import type { PublicConfig } from "./public";

declare const __TC_PUBLIC_CONFIG__: PublicConfig;

const config: PublicConfig = __TC_PUBLIC_CONFIG__;

export default config;
export type { PublicConfig };
