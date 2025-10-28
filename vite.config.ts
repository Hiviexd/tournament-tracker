import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

const commitHash = execSync("git rev-parse HEAD").toString().trim();
const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
const branchName = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

// Get commit data for the past year
function getCommitData() {
    try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const startDate = oneYearAgo.toISOString().split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];

        // Get commits with dates in the format YYYY-MM-DD
        const gitCommand = `git log --since="${startDate}" --until="${endDate}" --pretty=format:"%ad" --date=short`;
        const commitDates = execSync(gitCommand, { encoding: "utf8" })
            .trim()
            .split("\n")
            .filter((date) => date.trim() !== "");

        // Count commits per date
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

// https://vitejs.dev/config/
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
        outDir: "dist/client",
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
        __COMMIT_MESSAGE__: JSON.stringify(commitMessage),
        __COMMIT_DATA__: JSON.stringify(commitData),
        __BRANCH_NAME__: JSON.stringify(branchName),
    },
});
