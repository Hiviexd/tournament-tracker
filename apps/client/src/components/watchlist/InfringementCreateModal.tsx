import { Modal, TextInput, Stack, Select, Button, Group, Text, Checkbox, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useState } from "react";
import MultipleUsersInput from "../common/MultipleUsersInput";
import TextEditor from "../common/TextEditor";
import { useAddInfringement } from "../../hooks/useInfringements";
import { InfringementType, TIME_BASED_TYPES } from "@tc/types/Infringement";
import { IUser } from "@tc/types/User";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import startCase from "lodash/startCase.js";
import utils, { isString } from "@tc/utils/client";
import { useConfirmModal } from "../../hooks/useModals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "@tc/utils/dayjs";

const DURATION_PRESETS = [
    { label: "1 month", months: 1 },
    { label: "3 months", months: 3 },
    { label: "6 months", months: 6 },
    { label: "1 year", months: 12 },
] as const;

interface IProps {
    opened: boolean;
    onClose: () => void;
    preselectedUser?: IUser | null;
}

export default function InfringementCreateModal({ opened, onClose, preselectedUser }: IProps) {
    const [selectedUsers, setSelectedUsers] = useState<IUser[]>(preselectedUser ? [preselectedUser] : []);
    const preselectedUserId = preselectedUser?.id;

    const addInfringementMutation = useAddInfringement();
    const autoSaveKey = "infringement-create-reason";
    const confirmModal = useConfirmModal();

    const form = useForm<{
        userIds: string[];
        type: InfringementType | "";
        startDate: Date;
        endDate: Date | null;
        isIndefinite: boolean;
        reason: string;
        threadId: string;
        enchantUrl: string;
    }>({
        initialValues: {
            userIds: preselectedUserId ? [preselectedUserId] : [],
            type: "",
            startDate: new Date(),
            endDate: null,
            isIndefinite: false,
            reason: "",
            threadId: "",
            enchantUrl: "",
        },
        validate: {
            userIds: (value) => {
                if (preselectedUserId) return null;
                return !value || value.length === 0 ? "At least one user is required" : null;
            },
            type: (value) => (!value ? "Infringement type is required" : null),
            startDate: (value) => {
                if (isNonTimeBased) return null;
                if (!value) return "Start date is required for punishments";
                return null;
            },
            endDate: (value) => {
                if (isNonTimeBased || form.values.isIndefinite) return null;
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
                if (value && value?.trim() === "") return "Thread ID must be a non-empty string";
                return null;
            },
            enchantUrl: (value) => {
                if (value && !utils.isEnchantTicketLink(value)) return "Invalid Enchant ticket URL format";
                return null;
            },
        },
    });

    const selectedType = form.values.type;
    const isNonTimeBased = !selectedType || !TIME_BASED_TYPES.includes(selectedType);

    const infringementTypeOptions = [
        { value: InfringementType.NOTE, label: startCase(InfringementType.NOTE) },
        { value: InfringementType.WARNING, label: startCase(InfringementType.WARNING) },
        { value: InfringementType.TOURNAMENT_BAN, label: startCase(InfringementType.TOURNAMENT_BAN) },
        { value: InfringementType.HOSTING_BAN, label: startCase(InfringementType.HOSTING_BAN) },
        { value: InfringementType.STAFFING_BAN, label: startCase(InfringementType.STAFFING_BAN) },
    ];

    const handleSubmit = async (values: typeof form.values) => {
        try {
            const targetUsers = preselectedUser ? [preselectedUser] : selectedUsers;
            const targetUserIds = preselectedUserId ? [preselectedUserId] : values.userIds;

            let confirmed = true;
            const hasActiveInfringement = targetUsers.some((user) => user.activeInfringement);
            if (hasActiveInfringement && !isNonTimeBased) {
                confirmed = await confirmModal({
                    title: "Add Infringement",
                    text: `Some selected users have active infringements. Adding a new infringement will expire each active one. Are you sure you want to add this infringement?`,
                    confirmText: "Add Infringement",
                    confirmProps: { color: "primary", leftSection: <FontAwesomeIcon icon="gavel" /> },
                });
            }

            if (!confirmed) return;

            const payload: any = {
                userIds: targetUserIds,
                type: values.type,
                reason: values.reason.trim(),
                threadId: values.threadId.trim() || undefined,
                enchantUrl: values.enchantUrl.trim() || undefined,
            };

            // Add dates for punishments
            if (!isNonTimeBased) {
                payload.startDate = values.startDate;
                if (!values.isIndefinite && values.endDate) {
                    payload.endDate = values.endDate;
                }
            }

            await addInfringementMutation.mutateAsync(payload);

            handleClose();
        } catch (error) {
            console.error("Failed to add infringement:", error);
        }
    };

    const handleClose = () => {
        form.reset();
        form.setFieldValue("userIds", preselectedUserId ? [preselectedUserId] : []);
        setSelectedUsers(preselectedUser ? [preselectedUser] : []);
        // Reset dates
        form.setFieldValue("startDate", new Date());
        form.setFieldValue("endDate", null);
        clearAutoSavedValue(autoSaveKey);
        onClose();
    };

    const handleIndefiniteChange = (checked: boolean) => {
        form.setFieldValue("isIndefinite", checked);
        if (checked) {
            form.setFieldValue("endDate", null);
        }
    };

    const applyDurationPreset = (months: number) => {
        const mStart = form.values.startDate ? dayjs(form.values.startDate).startOf("day") : dayjs().startOf("day");
        const end = mStart.clone().add(months, "months").add(1, "day");
        form.setFieldValue("startDate", mStart.toDate());
        form.setFieldValue("isIndefinite", false);
        form.setFieldValue("endDate", end.toDate());
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
                        <MultipleUsersInput
                            label="Users"
                            value={selectedUsers}
                            onChange={(users) => {
                                setSelectedUsers(users);
                                form.setFieldValue(
                                    "userIds",
                                    users.map((user) => user.id),
                                );
                            }}
                            error={isString(form.errors.userIds) ? form.errors.userIds : undefined}
                            required
                            allowUserCreation
                            showActiveInfringementWarning
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

                    {!isNonTimeBased && (
                        <Stack gap="xs">
                            <Box>
                                <Text size="sm" fw={500} mb={6}>
                                    Duration preset
                                </Text>
                                <Button.Group mod="full-width">
                                    {DURATION_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.months}
                                            type="button"
                                            size="xs"
                                            variant="light"
                                            onClick={() => applyDurationPreset(preset.months)}>
                                            {preset.label}
                                        </Button>
                                    ))}
                                </Button.Group>
                            </Box>

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
                                        ? dayjs(form.values.startDate).add(1, "day").toDate()
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
                        <Button type="submit" loading={addInfringementMutation.isPending}>
                            Add Infringement
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
