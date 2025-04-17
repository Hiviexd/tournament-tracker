import { Request, Response } from "express";
import { execSync } from "child_process";

/**
 * Get the git hash of the current commit
 * @returns The git hash of the current commit
 */
function getGitHash() {
    try {
        return execSync("git rev-parse HEAD").toString().trim();
    } catch (error) {
        return "unknown";
    }
}

class VersionController {
    public getVersion(_: Request, res: Response) {
        res.json({ hash: getGitHash() });
    }
}

export default new VersionController();
