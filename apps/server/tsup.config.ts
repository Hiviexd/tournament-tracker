import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["main.ts"],
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
