import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["assets/**/*", "fonts/**/*"],
            manifest: {
                name: "Tournament Tracker",
                short_name: "TourneyTrack",
                description: "The one-stop shop for all official osu! tournament correspondence and information!",
                theme_color: "#6e0c9d",
                background_color: "#1a171c",
                display: "standalone",
                icons: [
                    {
                        src: "/assets/logo-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/assets/logo-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/assets/logo-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
        }),
    ],
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
});
