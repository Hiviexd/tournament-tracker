import { Modal, Stack, Group, Button, Select } from "@mantine/core";
import { useState } from "react";

interface IProps {
    opened: boolean;
    onClose: () => void;
    options: { value: string; label: string }[];
    onSubmit: (newReviewerId: string) => Promise<void>;
    loading?: boolean;
}

export default function ReviewerReassignModal({ opened, onClose, options, onSubmit, loading = false }: IProps) {
    const [selectedId, setSelectedId] = useState<string>("");

    const handleSubmit = async () => {
        if (!selectedId) return;
        await onSubmit(selectedId);
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Reassign reviewer" size="sm">
            <Stack gap="md">
                <Select
                    label="New reviewer"
                    placeholder="Select new reviewer"
                    data={options}
                    value={selectedId}
                    onChange={(value) => setSelectedId(value || "")}
                    allowDeselect={false}
                />
                <Group justify="flex-end" gap="xs">
                    <Button variant="light" color="gray" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedId} loading={loading}>
                        Confirm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
