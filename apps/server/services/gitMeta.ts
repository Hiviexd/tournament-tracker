export type GitMeta = {
    hash: string;
    message: string;
    branch: string;
    commitData: Record<string, number>;
    ahead: number | null;
    behind: number | null;
};

export function parseGitMeta(raw: unknown): GitMeta | null {
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const record = raw as Record<string, unknown>;
    if (typeof record.hash !== "string" || record.hash.length === 0) {
        return null;
    }

    const commitData: Record<string, number> = {};
    if (record.commitData && typeof record.commitData === "object") {
        for (const [date, count] of Object.entries(record.commitData as Record<string, unknown>)) {
            if (typeof count === "number") {
                commitData[date] = count;
            }
        }
    }

    return {
        hash: record.hash,
        message: typeof record.message === "string" ? record.message : "",
        branch: typeof record.branch === "string" ? record.branch : "unknown",
        commitData,
        ahead: typeof record.ahead === "number" ? record.ahead : null,
        behind: typeof record.behind === "number" ? record.behind : null,
    };
}
