import { describe, expect, it } from "vitest";
import { IReviewChecklists } from "@tc/types/Checklist";
import { diffReviewChecklists, hasChecklistDiscordDiff } from "../../utils/checklistDiff";

const sample: IReviewChecklists = {
    tc: [{ category: "Forum", items: ["Post exists", "Rules are clear"] }],
    cc: [{ category: "Theme", items: ["Theme is appropriate"] }],
};

function diffBlock(body: string): string {
    return `\`\`\`diff\n${body}\n\`\`\``;
}

describe("diffReviewChecklists", () => {
    it("returns no fields when checklists are identical", () => {
        const diff = diffReviewChecklists(sample, sample);
        expect(diff).toEqual({ fields: [], reordered: [] });
        expect(hasChecklistDiscordDiff(diff)).toBe(false);
    });

    it("shows every item in a modified category with diff markers", () => {
        const next: IReviewChecklists = {
            tc: [{ category: "Forum", items: ["Thread exists", "Rules are clear"] }],
            cc: sample.cc,
        };

        const diff = diffReviewChecklists(sample, next);
        expect(diff.fields).toEqual([
            {
                name: "TC · Forum",
                value: diffBlock(["- Post exists", "+ Thread exists", " Rules are clear"].join("\n")),
            },
        ]);
        expect(hasChecklistDiscordDiff(diff)).toBe(true);
    });

    it("marks every item as added for a new category", () => {
        const diff = diffReviewChecklists({ tc: [], cc: sample.cc }, { tc: sample.tc, cc: sample.cc });
        expect(diff.fields).toEqual([
            {
                name: "TC · Forum",
                value: diffBlock(["+ Post exists", "+ Rules are clear"].join("\n")),
            },
        ]);
    });

    it("emits a + block per new category on a large first fill", () => {
        const filled: IReviewChecklists = {
            tc: [
                { category: "Category 1", items: ["Item 1a", "Item 1b"] },
                { category: "Category 2", items: ["Item 2a", "Item 2b"] },
            ],
            cc: sample.cc,
        };

        const diff = diffReviewChecklists({ tc: [], cc: sample.cc }, filled);
        expect(diff.fields).toEqual([
            {
                name: "TC · Category 1",
                value: diffBlock(["+ Item 1a", "+ Item 1b"].join("\n")),
            },
            {
                name: "TC · Category 2",
                value: diffBlock(["+ Item 2a", "+ Item 2b"].join("\n")),
            },
        ]);
    });

    it("marks every item as removed when a category is deleted", () => {
        const diff = diffReviewChecklists(sample, { tc: [], cc: sample.cc });
        expect(diff.fields).toEqual([
            {
                name: "TC · Forum",
                value: diffBlock(["- Post exists", "- Rules are clear"].join("\n")),
            },
        ]);
    });

    it("uses the field name for a category rename and keeps items as context", () => {
        const next: IReviewChecklists = {
            tc: [{ category: "Forums", items: ["Post exists", "Rules are clear"] }],
            cc: sample.cc,
        };

        const diff = diffReviewChecklists(sample, next);
        expect(diff.fields).toEqual([
            {
                name: "TC · Forum → Forums",
                value: diffBlock([" Post exists", " Rules are clear"].join("\n")),
            },
        ]);
    });

    it("treats a single removed/added category pair as a rename even when items change", () => {
        const next: IReviewChecklists = {
            tc: [{ category: "Forums", items: ["Thread exists", "Rules are clear"] }],
            cc: sample.cc,
        };

        const diff = diffReviewChecklists(sample, next);
        expect(diff.fields).toEqual([
            {
                name: "TC · Forum → Forums",
                value: diffBlock(["- Post exists", "+ Thread exists", " Rules are clear"].join("\n")),
            },
        ]);
    });

    it("notes category reorder without a per-category block when items are unchanged", () => {
        const previous: IReviewChecklists = {
            tc: [
                { category: "Forum", items: ["Post exists"] },
                { category: "Dates", items: ["Start date is correct"] },
            ],
            cc: sample.cc,
        };
        const next: IReviewChecklists = {
            tc: [
                { category: "Dates", items: ["Start date is correct"] },
                { category: "Forum", items: ["Post exists"] },
            ],
            cc: sample.cc,
        };

        const diff = diffReviewChecklists(previous, next);
        expect(diff.fields).toEqual([]);
        expect(diff.reordered).toEqual(["TC"]);
        expect(hasChecklistDiscordDiff(diff)).toBe(true);
    });

    it("shows the full item list so a reorder is visible", () => {
        const next: IReviewChecklists = {
            tc: [{ category: "Forum", items: ["Rules are clear", "Post exists"] }],
            cc: sample.cc,
        };

        const diff = diffReviewChecklists(sample, next);
        expect(diff.fields).toEqual([
            {
                name: "TC · Forum",
                value: diffBlock(["- Post exists", " Rules are clear", "+ Post exists"].join("\n")),
            },
        ]);
    });
});
