import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        // Test files pattern
        include: ["tests/**/*.{test,spec}.{js,ts}"],
        exclude: ["node_modules", "dist"],

        // Environment setup
        environment: "node",

        // Globals for better testing experience
        globals: true,

        // Coverage configuration
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["services/**/*.ts", "controllers/**/*.ts", "models/**/*.ts"],
            exclude: ["tests/**", "node_modules/**", "dist/**"],
        },

        // Timeouts
        testTimeout: 10000,
        hookTimeout: 10000,
    },

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
            "@interfaces": path.resolve(__dirname, "../interfaces"),
            "@utils": path.resolve(__dirname, "../utils"),
        },
    },
});
