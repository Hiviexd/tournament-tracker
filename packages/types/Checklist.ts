export interface IChecklistCategory {
    category: string;
    items: string[];
}

export interface IReviewChecklists {
    tc: IChecklistCategory[];
    cc: IChecklistCategory[];
}

export const DEFAULT_REVIEW_CHECKLISTS: IReviewChecklists = {
    tc: [
        {
            category: "example category 1",
            items: ["example item 1", "example item 2", "example item 3"],
        },
        {
            category: "example category 2",
            items: ["example item 4", "example item 5"],
        },
    ],
    cc: [
        {
            category: "example category 3",
            items: ["example item 6", "example item 7", "example item 8"],
        },
        {
            category: "example category 4",
            items: ["example item 9", "example item 10"],
        },
    ],
};
