import { useRef } from "react";
import { IChecklistCategory } from "@tc/types/Checklist";
import { useConfirmModal } from "./useModals";

interface ChecklistIds {
    categories: string[];
    items: string[][];
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
    return copy;
}

function nextUniqueName(existing: string[], prefix: string): string {
    const names = new Set(existing);
    if (!names.has(prefix)) return prefix;
    let n = 2;
    while (names.has(`${prefix} ${n}`)) n++;
    return `${prefix} ${n}`;
}

function createIds(categories: IChecklistCategory[]): ChecklistIds {
    return {
        categories: categories.map(() => crypto.randomUUID()),
        items: categories.map((category) => category.items.map(() => crypto.randomUUID())),
    };
}

function idsMatchStructure(ids: ChecklistIds, categories: IChecklistCategory[]): boolean {
    return (
        ids.categories.length === categories.length &&
        ids.items.length === categories.length &&
        ids.items.every((itemIds, index) => itemIds.length === categories[index].items.length)
    );
}

export function useChecklistListEditor(
    categories: IChecklistCategory[],
    onChange: (categories: IChecklistCategory[]) => void,
) {
    const confirmModal = useConfirmModal();
    const idsRef = useRef<ChecklistIds>(createIds(categories));
    const lastCategoriesRef = useRef(categories);

    if (categories !== lastCategoriesRef.current) {
        if (!idsMatchStructure(idsRef.current, categories)) {
            idsRef.current = createIds(categories);
        }
        lastCategoriesRef.current = categories;
    }

    const ids = idsRef.current;

    const emit = (next: IChecklistCategory[]) => {
        lastCategoriesRef.current = next;
        onChange(next);
    };

    const addCategory = () => {
        idsRef.current = {
            categories: [...ids.categories, crypto.randomUUID()],
            items: [...ids.items, [crypto.randomUUID()]],
        };
        emit([
            ...categories,
            {
                category: nextUniqueName(
                    categories.map((category) => category.category),
                    "New category",
                ),
                items: [
                    nextUniqueName(
                        categories.flatMap((category) => category.items),
                        "New item",
                    ),
                ],
            },
        ]);
    };

    const renameCategory = (index: number, name: string) => {
        emit(categories.map((category, i) => (i === index ? { ...category, category: name } : category)));
    };

    const moveCategory = (index: number, direction: -1 | 1) => {
        idsRef.current = {
            categories: moveItem(ids.categories, index, direction),
            items: moveItem(ids.items, index, direction),
        };
        emit(moveItem(categories, index, direction));
    };

    const deleteCategory = async (index: number) => {
        const category = categories[index];
        if (
            !(await confirmModal({
                preset: "delete",
                title: `Delete category "${category.category}"?`,
                text: "This removes the category and its items from the live checklist. Existing reviews keep the previous wording.",
            }))
        ) {
            return;
        }
        idsRef.current = {
            categories: ids.categories.filter((_, i) => i !== index),
            items: ids.items.filter((_, i) => i !== index),
        };
        emit(categories.filter((_, i) => i !== index));
    };

    const addItem = (categoryIndex: number) => {
        idsRef.current = {
            ...ids,
            items: ids.items.map((itemIds, i) => (i === categoryIndex ? [...itemIds, crypto.randomUUID()] : itemIds)),
        };
        const used = categories.flatMap((category) => category.items);
        emit(
            categories.map((category, i) =>
                i === categoryIndex
                    ? { ...category, items: [...category.items, nextUniqueName(used, "New item")] }
                    : category,
            ),
        );
    };

    const renameItem = (categoryIndex: number, itemIndex: number, text: string) => {
        emit(
            categories.map((category, i) =>
                i === categoryIndex
                    ? { ...category, items: category.items.map((item, j) => (j === itemIndex ? text : item)) }
                    : category,
            ),
        );
    };

    const moveItemInCategory = (categoryIndex: number, itemIndex: number, direction: -1 | 1) => {
        idsRef.current = {
            ...ids,
            items: ids.items.map((itemIds, i) =>
                i === categoryIndex ? moveItem(itemIds, itemIndex, direction) : itemIds,
            ),
        };
        emit(
            categories.map((category, i) =>
                i === categoryIndex ? { ...category, items: moveItem(category.items, itemIndex, direction) } : category,
            ),
        );
    };

    const deleteItem = async (categoryIndex: number, itemIndex: number) => {
        const item = categories[categoryIndex].items[itemIndex];
        if (
            !(await confirmModal({
                preset: "delete",
                title: "Delete item?",
                text: `"${item}" will be removed from the live checklist. Existing reviews keep the previous wording.`,
            }))
        ) {
            return;
        }
        idsRef.current = {
            ...ids,
            items: ids.items.map((itemIds, i) =>
                i === categoryIndex ? itemIds.filter((_, j) => j !== itemIndex) : itemIds,
            ),
        };
        emit(
            categories.map((category, i) =>
                i === categoryIndex
                    ? { ...category, items: category.items.filter((_, j) => j !== itemIndex) }
                    : category,
            ),
        );
    };

    return {
        ids,
        addCategory,
        renameCategory,
        moveCategory,
        deleteCategory,
        addItem,
        renameItem,
        moveItem: moveItemInCategory,
        deleteItem,
    };
}
