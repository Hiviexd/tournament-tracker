import { ActionIcon, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    upLabel: string;
    downLabel: string;
    deleteLabel: string;
}

export default function ChecklistReorderActions({
    onMoveUp,
    onMoveDown,
    onDelete,
    canMoveUp,
    canMoveDown,
    upLabel,
    downLabel,
    deleteLabel,
}: IProps) {
    return (
        <Group gap={4} wrap="nowrap">
            <ActionIcon variant="subtle" aria-label={upLabel} disabled={!canMoveUp} onClick={onMoveUp}>
                <FontAwesomeIcon icon="arrow-up" />
            </ActionIcon>
            <ActionIcon variant="subtle" aria-label={downLabel} disabled={!canMoveDown} onClick={onMoveDown}>
                <FontAwesomeIcon icon="arrow-down" />
            </ActionIcon>
            <ActionIcon variant="subtle" color="danger" aria-label={deleteLabel} onClick={onDelete}>
                <FontAwesomeIcon icon="trash" />
            </ActionIcon>
        </Group>
    );
}
