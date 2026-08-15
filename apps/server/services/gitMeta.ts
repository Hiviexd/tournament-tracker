import { isNumber, isPlainObject, isString } from "@tc/utils/common";

export type GitMeta = {
    hash: string;
    message: string;
    branch: string;
    commitData: Record<string, number>;
    ahead: number | null;
    behind: number | null;
};

export function parseGitMeta<T>(raw: T): GitMeta | null {
    if (!isPlainObject(raw) || !("hash" in raw) || !isString(raw.hash) || raw.hash.length === 0) {
        return null;
    }

    const commitData: Record<string, number> = {};
    if ("commitData" in raw && isPlainObject(raw.commitData)) {
        for (const [date, count] of Object.entries(raw.commitData)) {
            if (isNumber(count)) {
                commitData[date] = count;
            }
        }
    }

    return {
        hash: raw.hash,
        message: "message" in raw && isString(raw.message) ? raw.message : "",
        branch: "branch" in raw && isString(raw.branch) ? raw.branch : "unknown",
        commitData,
        ahead: "ahead" in raw && isNumber(raw.ahead) ? raw.ahead : null,
        behind: "behind" in raw && isNumber(raw.behind) ? raw.behind : null,
    };
}
