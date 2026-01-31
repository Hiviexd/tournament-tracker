import { defineConfig } from "tsup";
import { globSync } from "glob";

// Get all job files for separate entry points (needed for dynamic discovery at runtime)
// Exclude BaseJob.ts as it's the base class, not an actual job
const jobFiles = globSync("server/jobs/*Job.ts", { ignore: ["**/BaseJob.ts"] }).map((f) => f.replace(/\\/g, "/")); // Normalize Windows paths

export default defineConfig({
    entry: ["server/app.ts", ...jobFiles],
    outDir: "dist/server",
    target: "node20",
    format: ["esm"],
    splitting: true,
    sourcemap: false,
    clean: true,
    dts: false,
    external: ["express", "express-async-errors"],
    tsconfig: "server/tsconfig.json",
});
