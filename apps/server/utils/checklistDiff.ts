import { IChecklistCategory, IReviewChecklists } from "@tc/types/Checklist";
import utils from "@tc/utils/server";

const DISCORD_FIELD_LIMIT = 1024;
const DISCORD_FIELD_NAME_LIMIT = 256;
const DISCORD_MAX_FIELDS = 25;

export interface ChecklistDiscordField {
    name: string;
    value: string;
}

export interface ChecklistDiscordDiff {
    fields: ChecklistDiscordField[];
    reordered: Array<"TC" | "CC">;
}

function sameItemSet(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((item) => set.has(item));
}

function relativeOrderChanged(previous: string[], next: string[]): boolean {
    const nextSet = new Set(next);
    const previousSet = new Set(previous);
    const previousFiltered = previous.filter((name) => nextSet.has(name));
    const nextFiltered = next.filter((name) => previousSet.has(name));
    return previousFiltered.some((name, index) => name !== nextFiltered[index]);
}

function lcsItemLines(previous: string[], next: string[]): string[] {
    const n = previous.length;
    const m = next.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = previous[i] === next[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    const lines: string[] = [];
    let i = 0;
    let j = 0;

    while (i < n && j < m) {
        if (previous[i] === next[j]) {
            lines.push(` ${previous[i]}`);
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            lines.push(`- ${previous[i]}`);
            i++;
        } else {
            lines.push(`+ ${next[j]}`);
            j++;
        }
    }

    while (i < n) {
        lines.push(`- ${previous[i]}`);
        i++;
    }
    while (j < m) {
        lines.push(`+ ${next[j]}`);
        j++;
    }

    return lines;
}

function wrapDiffFence(body: string): string {
    const overhead = "```diff\n\n```".length;
    return `\`\`\`diff\n${utils.shorten(body, DISCORD_FIELD_LIMIT - overhead)}\n\`\`\``;
}

function categoryFieldName(listLabel: "TC" | "CC", name: string, renamedFrom?: string): string {
    const label = renamedFrom ? `${renamedFrom} → ${name}` : name;
    return utils.shorten(`${listLabel} · ${label}`, DISCORD_FIELD_NAME_LIMIT);
}

function categoryField(
    listLabel: "TC" | "CC",
    name: string,
    previousItems: string[],
    nextItems: string[],
    renamedFrom?: string,
): ChecklistDiscordField | null {
    const lines = lcsItemLines(previousItems, nextItems);
    const changed = !!renamedFrom || lines.some((line) => line.startsWith("+") || line.startsWith("-"));
    if (!changed || !lines.length) return null;

    return {
        name: categoryFieldName(listLabel, name, renamedFrom),
        value: wrapDiffFence(lines.join("\n")),
    };
}

function pairRenames(previous: IChecklistCategory[], next: IChecklistCategory[]): { from: string; to: string }[] {
    const previousByName = new Map(previous.map((category) => [category.category, category]));
    const nextByName = new Map(next.map((category) => [category.category, category]));
    const previousNames = new Set(previous.map((category) => category.category));
    const nextNames = new Set(next.map((category) => category.category));
    const removed = previous.map((category) => category.category).filter((name) => !nextNames.has(name));
    const added = next.map((category) => category.category).filter((name) => !previousNames.has(name));

    const renamed: { from: string; to: string }[] = [];
    const usedAdded = new Set<string>();
    const usedRemoved = new Set<string>();

    for (const from of removed) {
        const match = added.find(
            (to) => !usedAdded.has(to) && sameItemSet(previousByName.get(from)!.items, nextByName.get(to)!.items),
        );
        if (!match) continue;
        renamed.push({ from, to: match });
        usedAdded.add(match);
        usedRemoved.add(from);
    }

    const leftoverRemoved = removed.filter((name) => !usedRemoved.has(name));
    const leftoverAdded = added.filter((name) => !usedAdded.has(name));
    if (leftoverRemoved.length === 1 && leftoverAdded.length === 1) {
        renamed.push({ from: leftoverRemoved[0], to: leftoverAdded[0] });
    }

    return renamed;
}

function diffList(
    listLabel: "TC" | "CC",
    previous: IChecklistCategory[],
    next: IChecklistCategory[],
): { fields: ChecklistDiscordField[]; reorderedCategories: boolean } {
    const previousByName = new Map(previous.map((category) => [category.category, category]));
    const nextByName = new Map(next.map((category) => [category.category, category]));
    const previousNameSet = new Set(previous.map((category) => category.category));
    const nextNameSet = new Set(next.map((category) => category.category));
    const renamed = pairRenames(previous, next);
    const renameTo = new Map(renamed.map(({ from, to }) => [from, to]));
    const renameFrom = new Map(renamed.map(({ from, to }) => [to, from]));
    const removedNames = previous
        .map((category) => category.category)
        .filter((name) => !nextNameSet.has(name) && !renameTo.has(name));

    const fields: ChecklistDiscordField[] = [];

    for (const category of next) {
        const from = renameFrom.get(category.category);
        if (from) {
            const field = categoryField(
                listLabel,
                category.category,
                previousByName.get(from)!.items,
                category.items,
                from,
            );
            if (field) fields.push(field);
            continue;
        }

        if (previousNameSet.has(category.category)) {
            const field = categoryField(
                listLabel,
                category.category,
                previousByName.get(category.category)!.items,
                category.items,
            );
            if (field) fields.push(field);
            continue;
        }

        const field = categoryField(listLabel, category.category, [], category.items);
        if (field) fields.push(field);
    }

    for (const name of removedNames) {
        const field = categoryField(listLabel, name, previousByName.get(name)!.items, []);
        if (field) fields.push(field);
    }

    const previousIdentities = previous.map((category) => renameTo.get(category.category) ?? category.category);
    const nextIdentities = next.map((category) => category.category);

    return {
        fields,
        reorderedCategories: relativeOrderChanged(previousIdentities, nextIdentities),
    };
}

export function hasChecklistDiscordDiff(diff: ChecklistDiscordDiff): boolean {
    return diff.fields.length > 0 || diff.reordered.length > 0;
}

/** One Discord embed field per modified category, with a full item-list diff. */
export function diffReviewChecklists(previous: IReviewChecklists, next: IReviewChecklists): ChecklistDiscordDiff {
    const tc = diffList("TC", previous.tc, next.tc);
    const cc = diffList("CC", previous.cc, next.cc);
    let fields = [...tc.fields, ...cc.fields];
    const reordered: Array<"TC" | "CC"> = [
        ...(tc.reorderedCategories ? (["TC"] as const) : []),
        ...(cc.reorderedCategories ? (["CC"] as const) : []),
    ];

    if (fields.length > DISCORD_MAX_FIELDS) {
        const omitted = fields.length - (DISCORD_MAX_FIELDS - 1);
        fields = [
            ...fields.slice(0, DISCORD_MAX_FIELDS - 1),
            { name: "…", value: `${omitted} more categories changed.` },
        ];
    }

    return { fields, reordered };
}
