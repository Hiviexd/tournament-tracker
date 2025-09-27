import { Modal, TextInput, Stack, Select, NumberInput, Button, Group, Text, Checkbox, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import UserSearch from "../common/UserSearch";
import TextEditor from "../common/TextEditor";
import { useAddInfringement } from "../../hooks/useUsers";
import { InfringementType, IUser } from "../../../interfaces/User";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import _ from "lodash";

interface IProps {
    opened: boolean;
    onClose: () => void;
    preselectedUser?: IUser | null;
}

export default function InfringementCreateModal({ opened, onClose, preselectedUser }: IProps) {
    const preselectedUserId = preselectedUser?.id;
    const addInfringementMutation = useAddInfringement();
    const autoSaveKey = "infringement-create-reason";

    const form = useForm({
        initialValues: {
            userId: preselectedUserId || "",
            type: "" as InfringementType,
            duration: 0,
            isIndefinite: false,
            reason: "",
            threadId: "",
        },
        validate: {
            userId: (value) => {
                return !value ? "User is required" : null;
            },
            type: (value) => (!value ? "Infringement type is required" : null),
            duration: (value) => {
                if (disableDuration || form.values.isIndefinite) return null;
                if (value < 1) return "Duration cannot be less than 1";
                return null;
            },
            reason: (value) => {
                if (!value || value.trim() === "") return "Reason is required";
                if (value.trim().length < 4) return "Reason must be at least 4 characters";
                return null;
            },
        },
    });

    // Update form when preSelectedUserId changes
    useEffect(() => {
        if (preselectedUserId) {
            form.setFieldValue("userId", preselectedUserId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preselectedUserId]); // Cannot add form to dependencies to avoid infinite loop

    const disableDuration =
        form.values.type === InfringementType.NOTE ||
        form.values.type === InfringementType.WARNING ||
        form.values.type === InfringementType.PROBATION;

    const infringementTypeOptions = [
        { value: InfringementType.NOTE, label: _.startCase(InfringementType.NOTE) },
        { value: InfringementType.WARNING, label: _.startCase(InfringementType.WARNING) },
        { value: InfringementType.PROBATION, label: _.startCase(InfringementType.PROBATION) },
        { value: InfringementType.TOURNAMENT_BAN, label: _.startCase(InfringementType.TOURNAMENT_BAN) },
        { value: InfringementType.HOSTING_BAN, label: _.startCase(InfringementType.HOSTING_BAN) },
        { value: InfringementType.STAFFING_BAN, label: _.startCase(InfringementType.STAFFING_BAN) },
    ];

    const handleSubmit = async (values: typeof form.values) => {
        try {
            let duration = values.isIndefinite ? -1 : values.duration;
            if (disableDuration) duration = 0;

            await addInfringementMutation.mutateAsync({
                userId: values.userId,
                type: values.type,
                duration,
                reason: values.reason.trim(),
                threadId: values.threadId.trim() || undefined,
            });

            handleClose();
        } catch (error) {
            console.error("Failed to add infringement:", error);
        }
    };

    const handleClose = () => {
        form.reset();
        // Reset userId to preSelected if available
        if (preselectedUserId) {
            form.setFieldValue("userId", preselectedUserId);
        }
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
            key={`infringement-create-${preselectedUserId || "new"}`}
            opened={opened}
            onClose={handleClose}
            title="Add Infringement"
            size="xl">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    {!preselectedUserId && (
                        <UserSearch
                            label="User"
                            onChange={(user) => form.setFieldValue("userId", user?.id || "")}
                            error={form.errors.userId}
                            required
                            allowUserCreation
                        />
                    )}

                    <Select
                        label="Infringement Type"
                        placeholder="Select infringement type..."
                        data={infringementTypeOptions}
                        required
                        allowDeselect={false}
                        {...form.getInputProps("type")}
                    />

                    {!disableDuration && (
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

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={addInfringementMutation.isPending}>
                            Add Infringement
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
