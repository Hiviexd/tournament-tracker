import { IChecklistCategory, IReviewChecklists } from "@tc/types/Checklist";
import SettingsService from "./SettingsService";

type HttpError = { status: number; error: string };

function httpError(status: number, error: string): HttpError {
    return { status, error };
}

function toPlainChecklists(checklist: IReviewChecklists): IReviewChecklists {
    return {
        tc: checklist.tc.map((category) => ({
            category: category.category,
            items: [...category.items],
        })),
        cc: checklist.cc.map((category) => ({
            category: category.category,
            items: [...category.items],
        })),
    };
}

function normalizeList(list: unknown, label: "tc" | "cc"): IChecklistCategory[] {
    if (!Array.isArray(list)) {
        throw httpError(400, `Checklist ${label} must be an array`);
    }

    const categories: IChecklistCategory[] = [];
    const categoryNames = new Set<string>();
    const itemTexts = new Set<string>();

    for (const raw of list) {
        if (!raw || typeof raw !== "object") {
            throw httpError(400, `Invalid category in ${label}`);
        }

        const rawCategory = (raw as IChecklistCategory).category;
        const categoryName = typeof rawCategory === "string" ? rawCategory.trim() : "";

        if (!categoryName) {
            throw httpError(400, `Category name is required in ${label}`);
        }

        if (categoryNames.has(categoryName)) {
            throw httpError(400, `Duplicate category "${categoryName}" in ${label}`);
        }
        categoryNames.add(categoryName);

        const rawItems = (raw as IChecklistCategory).items;
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            throw httpError(400, `Category "${categoryName}" in ${label} must have at least one item`);
        }

        const items: string[] = [];
        for (const rawItem of rawItems) {
            if (typeof rawItem !== "string") {
                throw httpError(400, `Invalid item in category "${categoryName}" (${label})`);
            }
            const item = rawItem.trim();
            if (!item) {
                throw httpError(400, `Item text is required in category "${categoryName}" (${label})`);
            }
            if (itemTexts.has(item)) {
                throw httpError(400, `Duplicate item "${item}" in ${label}`);
            }
            itemTexts.add(item);
            items.push(item);
        }

        categories.push({ category: categoryName, items });
    }

    return categories;
}

export function normalizeChecklists(input: unknown): IReviewChecklists {
    if (!input || typeof input !== "object") {
        throw httpError(400, "Checklist body is required");
    }

    const body = input as Partial<IReviewChecklists>;
    return {
        tc: normalizeList(body.tc, "tc"),
        cc: normalizeList(body.cc, "cc"),
    };
}

class ChecklistService {
    public async getChecklists(): Promise<IReviewChecklists> {
        const settings = await SettingsService.get();
        return toPlainChecklists(settings.checklist);
    }

    public async updateChecklists(input: unknown): Promise<IReviewChecklists> {
        const checklist = normalizeChecklists(input);
        const settings = await SettingsService.updateChecklist(checklist);
        return toPlainChecklists(settings.checklist);
    }
}

export default new ChecklistService();
