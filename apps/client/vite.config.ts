import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

const commitHash = execSync("git rev-parse HEAD", { cwd: repoRoot }).toString().trim();
const commitMessage = execSync("git log -1 --pretty=%B", { cwd: repoRoot }).toString().trim();
const branchName = execSync("git rev-parse --abbrev-ref HEAD", { cwd: repoRoot }).toString().trim();

function getCommitData() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const startDate = oneYearAgo.toISOString().split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];

        const gitCommand = `git log --since="${startDate}" --until="${endDate}" --pretty=format:"%ad" --date=short`;
        const commitDates = execSync(gitCommand, { encoding: "utf8", cwd: repoRoot })
            .trim()
            .split("\n")
            .filter((date) => date.trim() !== "");

        const commitCounts: Record<string, number> = {};
        commitDates.forEach((date) => {
            commitCounts[date] = (commitCounts[date] || 0) + 1;
        });

        return commitCounts;
    } catch (error) {
        console.warn("Failed to get commit data:", error);
        return {};
    }
}

function loadPublicConfig() {
    const configPath = resolve(repoRoot, "config.json");
    if (!existsSync(configPath)) {
        console.warn("config.json missing — using empty public config for Vite");
        return {
            discord: { webhooks: { main: { serverId: "" } } },
            r2: { baseUrl: "" },
        };
    }
    const full = JSON.parse(readFileSync(configPath, "utf8"));
    return {
        discord: {
            webhooks: {
                main: {
                    serverId: full.discord?.webhooks?.main?.serverId ?? "",
                },
            },
        },
        r2: {
            baseUrl: full.r2?.baseUrl ?? "",
        },
    };
}

const commitData = getCommitData();
const publicConfig = loadPublicConfig();

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ["babel-plugin-react-compiler"],
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
        outDir: resolve(repoRoot, "dist/client"),
        emptyOutDir: true,
    },
    resolve: {
        alias: [
            { find: "@components", replacement: resolve(__dirname, "src/components") },
            { find: "@pages", replacement: resolve(__dirname, "src/pages") },
            { find: "@store", replacement: resolve(__dirname, "src/store") },
        ],
    },
    define: {
        __COMMIT_HASH__: JSON.stringify(commitHash),
        __COMMIT_MESSAGE__: JSON.stringify(commitMessage),
        __COMMIT_DATA__: JSON.stringify(commitData),
        __BRANCH_NAME__: JSON.stringify(branchName),
        __TC_PUBLIC_CONFIG__: JSON.stringify(publicConfig),
    },
});
