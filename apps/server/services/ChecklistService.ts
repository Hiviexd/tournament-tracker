import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { IReviewChecklists } from "@tc/types/Checklist";

function findRepoRoot(startDir: string): string {
    let dir = startDir;
    for (;;) {
        if (existsSync(join(dir, "pnpm-workspace.yaml")) || existsSync(join(dir, "checklist.json"))) {
            return dir;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            throw new Error("Could not find repository root containing checklist.json");
        }
        dir = parent;
    }
}

class ChecklistService {
    /** Read checklist.json from disk at runtime (supports VPS bind mounts). */
    public getChecklists(): IReviewChecklists {
        const here = dirname(fileURLToPath(import.meta.url));
        const root = findRepoRoot(here);
        const checklistPath = resolve(root, "checklist.json");

        if (!existsSync(checklistPath)) {
            throw new Error(`Missing checklist.json at ${checklistPath}. Copy checklist.example.json and fill it in.`);
        }

        return JSON.parse(readFileSync(checklistPath, "utf8")) as IReviewChecklists;
    }
}

export default new ChecklistService();
