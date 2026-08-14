import { Group, TextInput } from "@mantine/core";
import ChecklistReorderActions from "./ChecklistReorderActions";

interface IProps {
    flipId: string;
    value: string;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onChange: (value: string) => void;
    onMove: (direction: -1 | 1) => void;
    onDelete: () => void;
}

export default function ChecklistItemRow({
    flipId,
    value,
    index,
    isFirst,
    isLast,
    onChange,
    onMove,
    onDelete,
}: IProps) {
    return (
        <Group data-flip-id={flipId} wrap="nowrap" gap="xs" align="center">
            <TextInput
                value={value}
                onChange={(event) => onChange(event.currentTarget.value)}
                style={{ flex: 1 }}
                aria-label={`Item ${index + 1}`}
            />
            <ChecklistReorderActions
                canMoveUp={!isFirst}
                canMoveDown={!isLast}
                onMoveUp={() => onMove(-1)}
                onMoveDown={() => onMove(1)}
                onDelete={onDelete}
                upLabel="Move item up"
                downLabel="Move item down"
                deleteLabel="Delete item"
            />
        </Group>
    );
}
