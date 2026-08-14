import { Button, Card, Divider, Group, Stack, Text, TextInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IChecklistCategory } from "@tc/types/Checklist";
import ChecklistItemRow from "./ChecklistItemRow";
import ChecklistReorderActions from "./ChecklistReorderActions";
import FlipStack from "./FlipStack";

interface IProps {
    flipId: string;
    itemIds: string[];
    category: IChecklistCategory;
    isFirst: boolean;
    isLast: boolean;
    onRename: (name: string) => void;
    onMove: (direction: -1 | 1) => void;
    onDelete: () => void;
    onAddItem: () => void;
    onRenameItem: (itemIndex: number, text: string) => void;
    onMoveItem: (itemIndex: number, direction: -1 | 1) => void;
    onDeleteItem: (itemIndex: number) => void;
}

export default function ChecklistCategoryCard({
    flipId,
    itemIds,
    category,
    isFirst,
    isLast,
    onRename,
    onMove,
    onDelete,
    onAddItem,
    onRenameItem,
    onMoveItem,
    onDeleteItem,
}: IProps) {
    return (
        <Card data-flip-id={flipId} shadow="sm" p="lg" radius="md">
            <Stack gap="md">
                <Text className="header-border-left" size="sm" fw={500} mb="0">
                    Category
                </Text>
                <Group justify="space-between" align="center" wrap="nowrap">
                    <TextInput
                        placeholder="Category name"
                        value={category.category}
                        onChange={(event) => onRename(event.currentTarget.value)}
                        style={{ flex: 1 }}
                    />
                    <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                        {category.items.length} item{category.items.length !== 1 ? "s" : ""}
                    </Text>
                    <ChecklistReorderActions
                        canMoveUp={!isFirst}
                        canMoveDown={!isLast}
                        onMoveUp={() => onMove(-1)}
                        onMoveDown={() => onMove(1)}
                        onDelete={onDelete}
                        upLabel="Move category up"
                        downLabel="Move category down"
                        deleteLabel="Delete category"
                    />
                </Group>

                <Divider />

                <FlipStack gap="xs">
                    {category.items.map((item, itemIndex) => (
                        <ChecklistItemRow
                            key={itemIds[itemIndex]}
                            flipId={itemIds[itemIndex]}
                            value={item}
                            index={itemIndex}
                            isFirst={itemIndex === 0}
                            isLast={itemIndex === category.items.length - 1}
                            onChange={(text) => onRenameItem(itemIndex, text)}
                            onMove={(direction) => onMoveItem(itemIndex, direction)}
                            onDelete={() => onDeleteItem(itemIndex)}
                        />
                    ))}
                </FlipStack>

                <Button variant="light" size="xs" leftSection={<FontAwesomeIcon icon="plus" />} onClick={onAddItem}>
                    Add item
                </Button>
            </Stack>
        </Card>
    );
}
