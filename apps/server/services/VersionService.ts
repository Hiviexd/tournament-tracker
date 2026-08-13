import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { BranchStatus } from "@tc/types/Version";
import { GitMeta, parseGitMeta } from "./gitMeta";

function tryGit(command: string): string | null {
    try {
        const value = execSync(command).toString().trim();
        return value.length > 0 ? value : null;
    } catch {
        return null;
    }
}

function findGitMetaPath(): string | null {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (;;) {
        if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
            const candidate = join(dir, "git-meta.json");
            return existsSync(candidate) ? candidate : null;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            return null;
        }
        dir = parent;
    }
}

function loadGitMetaFile(): GitMeta | null {
    const metaPath = findGitMetaPath();
    if (!metaPath) {
        return null;
    }

    try {
        return parseGitMeta(JSON.parse(readFileSync(metaPath, "utf8")));
    } catch {
        return null;
    }
}

function envValue(...keys: string[]): string | null {
    for (const key of keys) {
        const value = process.env[key];
        if (value && value !== "unknown") {
            return value;
        }
    }
    return null;
}

function branchStatusFromMeta(meta: GitMeta | null): BranchStatus | null {
    if (!meta || !meta.branch || meta.branch === "main" || meta.branch === "HEAD" || meta.branch === "unknown") {
        return null;
    }
    if (meta.ahead === null && meta.behind === null) {
        return null;
    }
    return {
        currentBranch: meta.branch,
        ahead: meta.ahead ?? 0,
        behind: meta.behind ?? 0,
    };
}

class VersionService {
    private readonly hash: string;
    private readonly message: string;
    private readonly branchStatus: BranchStatus | null;

    constructor() {
        const meta = loadGitMetaFile();
        this.hash = this.computeGitHash(meta);
        this.message = this.computeGitMessage(meta);
        this.branchStatus = this.computeBranchStatus(meta);
    }

    /**
     * Get the git hash of the current commit that was captured at server startup
     */
    public getGitHash(): string {
        return this.hash;
    }

    /**
     * Get the commit message of the current commit that was captured at server startup
     */
    public getGitMessage(): string {
        return this.message;
    }

    /**
     * Get branch comparison status with main branch that was captured at server startup
     */
    public getBranchStatus(): BranchStatus | null {
        return this.branchStatus;
    }

    private computeGitHash(meta: GitMeta | null): string {
        return tryGit("git rev-parse HEAD") || meta?.hash || envValue("COMMIT_SHA", "GITHUB_SHA") || "unknown";
    }

    private computeGitMessage(meta: GitMeta | null): string {
        return tryGit("git log -1 --pretty=%B") || meta?.message || envValue("COMMIT_MESSAGE") || "";
    }

    /**
     * Compute branch comparison status with main branch.
     * Live git is preferred (local dev); Docker images have no git so they use baked git-meta.json.
     */
    private computeBranchStatus(meta: GitMeta | null): BranchStatus | null {
        const fromGit = this.computeBranchStatusFromGit();
        if (fromGit !== undefined) {
            return fromGit;
        }

        const fromMeta = branchStatusFromMeta(meta);
        if (fromMeta) {
            return fromMeta;
        }

        const branch = envValue("BRANCH_NAME", "GITHUB_REF_NAME");
        const ahead = envValue("BRANCH_AHEAD");
        const behind = envValue("BRANCH_BEHIND");
        if (!branch || branch === "main") {
            return null;
        }
        if (ahead === null && behind === null) {
            return null;
        }
        return {
            currentBranch: branch,
            ahead: ahead ? Number(ahead) : 0,
            behind: behind ? Number(behind) : 0,
        };
    }

    /**
     * @returns BranchStatus, null when on main, undefined when git is unavailable
     */
    private computeBranchStatusFromGit(): BranchStatus | null | undefined {
        try {
            const currentBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

            if (currentBranch === "main") {
                return null;
            }

            try {
                execSync("git fetch origin main", { stdio: "ignore" });
            } catch {
                // Continue even if fetch fails
            }

            const revList = execSync(`git rev-list --left-right --count origin/main...HEAD`).toString().trim();
            const [behind, ahead] = revList.split("\t").map(Number);

            return {
                currentBranch,
                ahead,
                behind,
            };
        } catch {
            return undefined;
        }
    }
}

export default new VersionService();
