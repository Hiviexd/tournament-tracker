import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

function git(command: string, fallback = ""): string {
    try {
        return execSync(command, { cwd: repoRoot, encoding: "utf8" }).toString().trim();
    } catch {
        return fallback;
    }
}

const commitHash = git("git rev-parse HEAD", process.env.COMMIT_SHA ?? "unknown");
const commitMessage = git("git log -1 --pretty=%B", "");
const branchName = git("git rev-parse --abbrev-ref HEAD", process.env.BRANCH_NAME ?? "unknown");

function getCommitData() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const startDate = oneYearAgo.toISOString().split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];

        const gitCommand = `git log --since="${startDate}" --until="${endDate}" --pretty=format:"%ad" --date=short`;
        const commitDates = git(gitCommand)
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

const commitData = getCommitData();

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
    },
});
