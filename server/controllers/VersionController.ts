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

/**
 * Get the commit message of the current commit
 * @returns The commit message of the current commit
 */
function getGitMessage() {
    try {
        return execSync("git log -1 --pretty=%B").toString().trim();
    } catch (error) {
        return "";
    }
}

class VersionController {
    public getVersion(_: Request, res: Response) {
        res.json({ hash: getGitHash(), message: getGitMessage() });
    }
}

export default new VersionController();
