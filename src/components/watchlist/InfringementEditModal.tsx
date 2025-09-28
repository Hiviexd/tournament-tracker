import { Modal, TextInput, Stack, NumberInput, Button, Group, Text, Checkbox, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import TextEditor from "../common/TextEditor";
import { useUpdateInfringement } from "../../hooks/useUsers";
import { InfringementType, IInfringement } from "../../../interfaces/User";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import utils from "../../../utils";

interface IProps {
    opened: boolean;
    onClose: () => void;
    infringement: IInfringement | null;
    userId: string;
}

export default function InfringementEditModal({ opened, onClose, infringement, userId }: IProps) {
    const updateInfringementMutation = useUpdateInfringement();
    const autoSaveKey = `infringement-edit-reason-${infringement?.id || "new"}`;

    const isNotPunishment =
        infringement?.type === InfringementType.NOTE ||
        infringement?.type === InfringementType.WARNING ||
        infringement?.type === InfringementType.PROBATION;

    const form = useForm({
        initialValues: {
            duration: infringement?.duration === -1 ? 0 : infringement?.duration || 0,
            isIndefinite: infringement?.duration === -1,
            reason: infringement?.reason || "",
            threadId: infringement?.threadId || "",
            enchantUrl: infringement?.enchantUrl || "",
        },
        validate: {
            duration: (value) => {
                if (isNotPunishment || form.values.isIndefinite) return null;
                if (value < 1) return "Duration cannot be less than 1";
                return null;
            },
            reason: (value) => {
                if (!value || value.trim() === "") return "Reason is required";
                if (value.trim().length < 4) return "Reason must be at least 4 characters";
                return null;
            },
            threadId: (value) => {
                if (value && value.trim() === "") return "Thread ID must be a non-empty string";
                return null;
            },
            enchantUrl: (value) => {
                if (value && !utils.isEnchantTicketLink(value)) return "Invalid Enchant ticket URL format";
                return null;
            },
        },
    });

    // Update form values when infringement changes
    useEffect(() => {
        if (infringement) {
            form.setValues({
                duration: infringement.duration === -1 ? 0 : infringement.duration || 0,
                isIndefinite: infringement.duration === -1,
                reason: infringement.reason || "",
                threadId: infringement.threadId || "",
                enchantUrl: infringement.enchantUrl || "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [infringement]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!infringement) return;

        try {
            let duration = values.isIndefinite ? -1 : values.duration;
            if (isNotPunishment) duration = 0;

            await updateInfringementMutation.mutateAsync({
                userId,
                infringementId: infringement.id!,
                duration,
                reason: values.reason.trim(),
                threadId: values.threadId.trim() || undefined,
                enchantUrl: values.enchantUrl.trim() || undefined,
            });

            handleClose();
        } catch (error) {
            console.error("Failed to update infringement:", error);
        }
    };

    const handleClose = () => {
        form.reset();
        clearAutoSavedValue(autoSaveKey);
        onClose();
    };

    const handleIndefiniteChange = (checked: boolean) => {
        form.setFieldValue("isIndefinite", checked);
        if (checked) {
            form.setFieldValue("duration", 0);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Edit Infringement"
            size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {!isNotPunishment && (
                        <Stack gap="xs">
                            <NumberInput
                                label="Duration (in days)"
                                placeholder="Enter duration..."
                                required
                                min={0}
                                disabled={form.values.isIndefinite}
                                {...form.getInputProps("duration")}
                            />

                            <Checkbox
                                label="Indefinite duration"
                                checked={form.values.isIndefinite}
                                onChange={(e) => handleIndefiniteChange(e.currentTarget.checked)}
                            />
                        </Stack>
                    )}

                    <Stack gap="0">
                        <Text size="sm" fw={500}>
                            Reason <span style={{ color: "var(--mantine-color-red-filled)" }}>*</span>
                        </Text>
                        <TextEditor
                            value={form.values.reason}
                            onChange={(value) => form.setFieldValue("reason", value)}
                            placeholder="Explain the reason for this infringement..."
                            minHeight={150}
                            autoSaveKey={autoSaveKey}
                        />
                        {form.errors.reason && (
                            <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                {form.errors.reason}
                            </Box>
                        )}
                    </Stack>

                    <TextInput
                        label="Thread ID"
                        placeholder="Discord thread ID (optional)"
                        {...form.getInputProps("threadId")}
                    />

                    <TextInput
                        label="Enchant URL"
                        placeholder="Enchant ticket URL (optional)"
                        {...form.getInputProps("enchantUrl")}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={updateInfringementMutation.isPending}>
                            Update Infringement
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
