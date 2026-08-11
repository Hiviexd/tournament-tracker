export interface IChecklistCategory {
    category: string;
    items: string[];
}

export interface IReviewChecklists {
    tc: IChecklistCategory[];
    cc: IChecklistCategory[];
}
