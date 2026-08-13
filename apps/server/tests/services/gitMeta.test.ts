import { describe, expect, it } from "vitest";
import { parseGitMeta } from "../../services/gitMeta";

describe("parseGitMeta", () => {
    it("returns null for invalid payloads", () => {
        expect(parseGitMeta(null)).toBeNull();
        expect(parseGitMeta("abc")).toBeNull();
        expect(parseGitMeta({})).toBeNull();
        expect(parseGitMeta({ hash: "" })).toBeNull();
    });

    it("reads baked docker metadata used by the version popup and heatmap", () => {
        const meta = parseGitMeta({
            hash: "abc123def456",
            message: "fix popup --skip-client-refresh",
            branch: "preview",
            commitData: { "2026-08-01": 3, "2026-08-02": "nope" },
            ahead: 2,
            behind: 1,
        });

        expect(meta).toEqual({
            hash: "abc123def456",
            message: "fix popup --skip-client-refresh",
            branch: "preview",
            commitData: { "2026-08-01": 3 },
            ahead: 2,
            behind: 1,
        });
    });
});
