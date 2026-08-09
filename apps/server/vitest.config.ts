import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        include: ["tests/**/*.{test,spec}.{js,ts}"],
        exclude: ["node_modules", "dist"],
        environment: "node",
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["services/**/*.ts", "controllers/**/*.ts", "models/**/*.ts"],
            exclude: ["tests/**", "node_modules/**", "dist/**"],
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});
