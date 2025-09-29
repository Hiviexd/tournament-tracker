import { Modal, TextInput, Stack, Button, Group, Text, Checkbox, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import TextEditor from "../common/TextEditor";
import { useUpdateInfringement } from "../../hooks/useUsers";
import { InfringementType, IInfringement } from "../../../interfaces/User";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import utils from "../../../utils";
import moment from "moment";

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
            startDate: infringement?.startDate ? new Date(infringement.startDate) : new Date(),
            endDate: infringement?.endDate ? new Date(infringement.endDate) : null,
            isIndefinite: infringement?.isIndefinite || false,
            reason: infringement?.reason || "",
            threadId: infringement?.threadId || "",
            enchantUrl: infringement?.enchantUrl || "",
        },
        validate: {
            startDate: (value) => {
                if (isNotPunishment) return null;
                if (!value) return "Start date is required for punishments";
                return null;
            },
            endDate: (value) => {
                if (isNotPunishment || form.values.isIndefinite) return null;
                if (!value) return "End date is required for finite punishments";
                if (form.values.startDate && value <= form.values.startDate) {
                    return "End date must be after start date";
                }
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
                startDate: infringement.startDate ? new Date(infringement.startDate) : new Date(),
                endDate: infringement.endDate ? new Date(infringement.endDate) : null,
                isIndefinite: infringement.isIndefinite || false,
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
            const payload: any = {
                userId,
                infringementId: infringement.id!,
                reason: values.reason.trim(),
                threadId: values.threadId.trim() || undefined,
                enchantUrl: values.enchantUrl.trim() || undefined,
            };

            // Add dates for punishments
            if (!isNotPunishment) {
                payload.startDate = values.startDate;
                if (!values.isIndefinite && values.endDate) {
                    payload.endDate = values.endDate;
                } else if (values.isIndefinite) {
                    payload.endDate = null;
                }
            }

            await updateInfringementMutation.mutateAsync(payload);

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
            form.setFieldValue("endDate", null);
        }
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="Edit Infringement" size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {!isNotPunishment && (
                        <Stack gap="xs">
                            <DateInput
                                label="Start Date"
                                placeholder="Select start date..."
                                required
                                clearable
                                {...form.getInputProps("startDate")}
                            />

                            <DateInput
                                label="End Date"
                                placeholder="Select end date..."
                                required={!form.values.isIndefinite}
                                disabled={form.values.isIndefinite}
                                clearable
                                minDate={
                                    form.values.startDate
                                        ? moment(form.values.startDate).add(1, "day").toDate()
                                        : undefined
                                }
                                {...form.getInputProps("endDate")}
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
