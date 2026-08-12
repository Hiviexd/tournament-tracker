import path from "path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [
        // Emit Nest decorator metadata the same way as @swc-node/register / .swcrc
        swc.vite({
            jsc: {
                parser: { syntax: "typescript", decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
                target: "es2020",
                keepClassNames: true,
            },
            module: { type: "es6" },
        }),
    ],
    test: {
        setupFiles: ["./tests/setup.ts"],
        include: ["tests/**/*.{test,spec}.{js,ts}"],
        exclude: ["node_modules", "dist"],
        environment: "node",
        globals: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["services/**/*.ts", "modules/**/*.ts"],
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
