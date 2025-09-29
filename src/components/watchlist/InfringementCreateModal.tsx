import { Modal, TextInput, Stack, Select, Button, Group, Text, Checkbox, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useState, useEffect } from "react";
import UserSearch from "../common/UserSearch";
import TextEditor from "../common/TextEditor";
import { useAddInfringement } from "../../hooks/useUsers";
import { InfringementType, IUser } from "../../../interfaces/User";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import _ from "lodash";
import utils from "../../../utils";
import { useConfirmModal } from "../../hooks/useModals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

interface IProps {
    opened: boolean;
    onClose: () => void;
    preselectedUser?: IUser | null;
}

export default function InfringementCreateModal({ opened, onClose, preselectedUser }: IProps) {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(preselectedUser || null);
    const preselectedUserId = preselectedUser?.id;

    const addInfringementMutation = useAddInfringement();
    const autoSaveKey = "infringement-create-reason";
    const confirmModal = useConfirmModal();

    const form = useForm({
        initialValues: {
            userId: preselectedUserId || "",
            type: "" as InfringementType,
            startDate: new Date(),
            endDate: null as Date | null,
            isIndefinite: false,
            reason: "",
            threadId: "",
            enchantUrl: "",
        },
        validate: {
            userId: (value) => {
                return !value ? "User is required" : null;
            },
            type: (value) => (!value ? "Infringement type is required" : null),
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
                if (value && value?.trim() === "") return "Thread ID must be a non-empty string";
                return null;
            },
            enchantUrl: (value) => {
                if (value && !utils.isEnchantTicketLink(value)) return "Invalid Enchant ticket URL format";
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

    const isNotPunishment =
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

    const handleSelectUser = (user: IUser | null) => {
        setSelectedUser(user);
        form.setFieldValue("userId", user?.id || "");
    };

    const handleSubmit = async (values: typeof form.values) => {
        try {
            let confirmed = true;
            const activeInfringement = preselectedUser?.activeInfringement || selectedUser?.activeInfringement;
            if (activeInfringement && !isNotPunishment) {
                confirmed = await confirmModal({
                    title: "Add Infringement",
                    text: `This user has an active ${activeInfringement.typeString}. Adding a new infringement will expire the active one. Are you sure you want to add this infringement?`,
                    confirmText: "Add Infringement",
                    confirmProps: { color: "primary", leftSection: <FontAwesomeIcon icon="gavel" /> },
                });
            }

            if (!confirmed) return;

            const payload: any = {
                userId: values.userId,
                type: values.type,
                reason: values.reason.trim(),
                threadId: values.threadId.trim() || undefined,
                enchantUrl: values.enchantUrl.trim() || undefined,
            };

            // Add dates for punishments
            if (!isNotPunishment) {
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
        // Reset userId to preSelected if available
        if (preselectedUserId) {
            form.setFieldValue("userId", preselectedUserId);
        }
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
                            onChange={handleSelectUser}
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
                        <Button type="submit" loading={addInfringementMutation.isPending}>
                            Add Infringement
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
