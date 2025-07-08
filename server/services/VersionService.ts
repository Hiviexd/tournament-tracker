import { execSync } from "child_process";
import { BranchStatus } from "../../interfaces/Version";

class VersionService {
    /**
     * Get the git hash of the current commit
     * @returns The git hash of the current commit
     */
    public getGitHash(): string {
        try {
            return execSync("git rev-parse HEAD").toString().trim();
        } catch (error) {
            return "unknown";
        }
    }

    /**
     * Get the commit message of the current commit
     * @returns The commit message of the current commit
     */
    public getGitMessage(): string {
        try {
            return execSync("git log -1 --pretty=%B").toString().trim();
        } catch (error) {
            return "";
        }
    }

    /**
     * Get branch comparison status with main branch
     * @returns Object with ahead/behind counts and current branch name
     */
    public getBranchStatus(): BranchStatus | null {
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

export default new VersionService();
