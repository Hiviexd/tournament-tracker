import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

const commitHash = execSync("git rev-parse HEAD").toString().trim();

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 8088,
        strictPort: true,
        proxy: {
            "/api": {
                target: `http://localhost:${process.env.PORT || "3000"}`,
            },
        },
    },
    build: {
        outDir: "dist/",
    },
    resolve: {
        alias: [
            { find: "@components", replacement: "/src/components" },
            { find: "@pages", replacement: "/src/pages" },
            { find: "@interfaces", replacement: "/interfaces" },
        ],
    },
    define: {
        __COMMIT_HASH__: JSON.stringify(commitHash),
    },
});
