import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
        outDir: "dist/public",
    },
    resolve: {
        alias: [
            { find: "@components", replacement: "/src/components" },
            { find: "@pages", replacement: "/src/pages" },
            { find: "@interfaces", replacement: "/interfaces" },
        ],
    },
});
