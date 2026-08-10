import { defineConfig } from "tsup";
import { globSync } from "glob";

const jobFiles = globSync("jobs/*Job.ts", { ignore: ["**/BaseJob.ts"] }).map((f) => f.replace(/\\/g, "/"));

export default defineConfig({
    entry: ["main.ts", ...jobFiles],
    outDir: "dist",
    target: "node20",
    format: ["esm"],
    splitting: true,
    sourcemap: false,
    clean: true,
    dts: false,
    // Bundle workspace TS packages — they export .ts sources (dev uses @swc-node/register).
    // Leaving them external makes `node dist/main.js` load raw .ts and fail on extensionless ESM imports.
    noExternal: [
        "lodash",
        "dayjs",
        "@tc/utils",
        "@tc/config",
        "@tc/types",
        "@tc/models",
        "@tc/osu",
        "@tc/notifications",
    ],
    tsconfig: "tsconfig.json",
});
