import { Injectable } from "@nestjs/common";
import { execSync } from "child_process";
import { BranchStatus } from "@tc/types/Version";

@Injectable()
export class VersionService {
    private readonly hash: string;
    private readonly message: string;
    private readonly branchStatus: BranchStatus | null;

    constructor() {
        this.hash = this.computeGitHash();
        this.message = this.computeGitMessage();

        // Only compute branch status once on startup; it will be reused for all requests
        this.branchStatus = this.computeBranchStatus();
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

    /**
     * Compute the git hash of the current commit
     * @returns The git hash of the current commit
     */
    private computeGitHash(): string {
        try {
            return execSync("git rev-parse HEAD").toString().trim();
        } catch (error) {
            return "unknown";
        }
    }

    /**
     * Compute the commit message of the current commit
     * @returns The commit message of the current commit
     */
    private computeGitMessage(): string {
        try {
            return execSync("git log -1 --pretty=%B").toString().trim();
        } catch (error) {
            return "";
        }
    }

    /**
     * Compute branch comparison status with main branch
     * This is run once at startup and reused for all requests.
     * @returns Object with ahead/behind counts and current branch name
     */
    private computeBranchStatus(): BranchStatus | null {
        try {
            // Get current branch name
            const currentBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

            // Only proceed if we're not on main branch
            if (currentBranch === "main") {
                return null;
            }

            // Fetch latest from remote to ensure accurate comparison
            try {
                execSync("git fetch origin main", { stdio: "ignore" });
            } catch (fetchError) {
                // Continue even if fetch fails
            }

            // Get ahead/behind counts compared to origin/main
            const revList = execSync(`git rev-list --left-right --count origin/main...HEAD`).toString().trim();
            const [behind, ahead] = revList.split("\t").map(Number);

            return {
                currentBranch,
                ahead,
                behind,
            };
        } catch (error) {
            return null;
        }
    }
}
