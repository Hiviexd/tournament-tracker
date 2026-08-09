import { defineConfig } from "tsup";
import { globSync } from "glob";

const jobFiles = globSync("jobs/*Job.ts", { ignore: ["**/BaseJob.ts"] }).map((f) => f.replace(/\\/g, "/"));

export default defineConfig({
    entry: ["app.ts", ...jobFiles],
    outDir: "dist",
    target: "node20",
    format: ["esm"],
    splitting: true,
    sourcemap: false,
    clean: true,
    dts: false,
    external: ["express", "express-async-errors"],
    noExternal: ["lodash", "dayjs", "@tc/utils", "@tc/config", "@tc/types"],
    tsconfig: "tsconfig.json",
});
