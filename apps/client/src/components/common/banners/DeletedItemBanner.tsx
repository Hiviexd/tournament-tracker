import { Alert, Button, Group, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DateBadge from "../badges/DateBadge";
import { useConfirmModal } from "../../../hooks/useModals";

interface IProps {
    itemLabel: string;
    deletedAt: Date;
    onRestore: () => void;
    isRestoring: boolean;
}

export default function DeletedItemBanner({ itemLabel, deletedAt, onRestore, isRestoring }: IProps) {
    const confirmModal = useConfirmModal();

    const handleRestore = async () => {
        if (
            await confirmModal({
                preset: "restore",
                title: `Restore ${itemLabel}?`,
                text: `Are you sure you want to restore this ${itemLabel}? It will be visible to everyone who could see it before it was deleted.`,
            })
        ) {
            onRestore();
        }
    };

    return (
        <Alert color="danger" title={`This ${itemLabel} is deleted`} icon={<FontAwesomeIcon icon="trash" />}>
            <Group justify="space-between" align="center">
                <Text size="sm" component="div">
                    Deleted <DateBadge date={deletedAt} staticColor />. Only admins can view this.
                </Text>
                <Button
                    size="sm"
                    color="success"
                    onClick={handleRestore}
                    loading={isRestoring}
                    leftSection={<FontAwesomeIcon icon="undo" />}>
                    Restore
                </Button>
            </Group>
        </Alert>
    );
}
