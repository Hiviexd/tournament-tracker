import { Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IChecklistCategory } from "@tc/types/Checklist";
import { useChecklistListEditor } from "../../hooks/useChecklistListEditor";
import ChecklistCategoryCard from "./ChecklistCategoryCard";
import FlipStack from "./FlipStack";
import EmptyState from "../common/EmptyState";

interface IProps {
    categories: IChecklistCategory[];
    onChange: (categories: IChecklistCategory[]) => void;
    canEdit?: boolean;
}

export default function ChecklistListEditor({ categories, onChange, canEdit = true }: IProps) {
    const editor = useChecklistListEditor(categories, onChange);

    return (
        <FlipStack gap="md">
            {categories.length === 0 && (
                <EmptyState
                    icon="clipboard-list"
                    title="No categories"
                    description={canEdit ? "Add a category to get started" : "No categories in this checklist"}
                />
            )}

            {categories.map((category, categoryIndex) => (
                <ChecklistCategoryCard
                    key={editor.ids.categories[categoryIndex]}
                    flipId={editor.ids.categories[categoryIndex]}
                    itemIds={editor.ids.items[categoryIndex]}
                    category={category}
                    canEdit={canEdit}
                    isFirst={categoryIndex === 0}
                    isLast={categoryIndex === categories.length - 1}
                    onRename={(name) => editor.renameCategory(categoryIndex, name)}
                    onMove={(direction) => editor.moveCategory(categoryIndex, direction)}
                    onDelete={() => editor.deleteCategory(categoryIndex)}
                    onAddItem={() => editor.addItem(categoryIndex)}
                    onRenameItem={(itemIndex, text) => editor.renameItem(categoryIndex, itemIndex, text)}
                    onMoveItem={(itemIndex, direction) => editor.moveItem(categoryIndex, itemIndex, direction)}
                    onDeleteItem={(itemIndex) => editor.deleteItem(categoryIndex, itemIndex)}
                />
            ))}

            {canEdit && (
                <Button
                    variant="light"
                    fullWidth
                    leftSection={<FontAwesomeIcon icon="plus" />}
                    onClick={editor.addCategory}>
                    Add category
                </Button>
            )}
        </FlipStack>
    );
}
