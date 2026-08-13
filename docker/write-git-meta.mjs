import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(command) {
    try {
        return execSync(command, { cwd: repoRoot, encoding: "utf8" }).trim();
    } catch {
        return "";
    }
}

try {
    execSync("git fetch --no-tags origin main", { cwd: repoRoot, stdio: "ignore" });
} catch {
    // Local clones and shallow CI checkouts still work off whatever refs they have.
}

const hash = process.env.COMMIT_SHA || process.env.GITHUB_SHA || git("git rev-parse HEAD");
if (!hash || hash === "unknown") {
    console.error("write-git-meta: could not determine git commit hash");
    process.exit(1);
}

const message = process.env.COMMIT_MESSAGE || git("git log -1 --pretty=%B");
let branch =
    process.env.BRANCH_NAME || process.env.GITHUB_REF_NAME || git("git rev-parse --abbrev-ref HEAD") || "unknown";
if (branch === "HEAD") {
    branch = process.env.BRANCH_NAME || process.env.GITHUB_REF_NAME || "unknown";
}

const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
const startDate = oneYearAgo.toISOString().split("T")[0];
const endDate = new Date().toISOString().split("T")[0];
const commitDates = git(`git log --since="${startDate}" --until="${endDate}" --pretty=format:"%ad" --date=short`)
    .split("\n")
    .filter((date) => date.trim() !== "");

const commitData = {};
for (const date of commitDates) {
    commitData[date] = (commitData[date] || 0) + 1;
}

let ahead = null;
let behind = null;
if (branch !== "main" && branch !== "unknown") {
    const revList = git("git rev-list --left-right --count origin/main...HEAD");
    if (revList) {
        const [behindCount, aheadCount] = revList.split("\t").map(Number);
        if (!Number.isNaN(aheadCount) && !Number.isNaN(behindCount)) {
            ahead = aheadCount;
            behind = behindCount;
        }
    }
}

const meta = { hash, message, branch, commitData, ahead, behind };
const outPath = resolve(repoRoot, "git-meta.json");
writeFileSync(outPath, `${JSON.stringify(meta)}\n`);
console.log(
    `write-git-meta: ${branch} ${hash.slice(0, 7)} (${Object.keys(commitData).length} days, ${commitDates.length} commits)`,
);
