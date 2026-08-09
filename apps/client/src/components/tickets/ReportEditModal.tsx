import { useState } from "react";
import { useForm } from "@mantine/form";
import { Modal, Stack, Select, TextInput, Button, Group, LoadingOverlay } from "@mantine/core";
import { ITicket } from "@tc/types/Ticket";
import UserSearch from "../common/UserSearch";
import { useEditTicket } from "../../hooks/useTickets";
import utils from "@tc/utils/client";

interface IProps {
    ticket: ITicket;
    opened: boolean;
    onClose: () => void;
}

export default function ReportEditModal({ ticket, opened, onClose }: IProps) {
    const editTicketMutation = useEditTicket(ticket.id);
    const [reportType, setReportType] = useState<"user" | "tournament">(ticket.targetUser ? "user" : "tournament");

    const form = useForm({
        initialValues: {
            targetUserId: ticket.targetUser?.id || "",
            targetTournamentName: ticket.targetTournamentName || "",
            targetTournamentLink: ticket.targetTournamentLink || "",
        },
        validate: {
            targetUserId: (value) => (reportType === "user" && !value ? "Target user is required" : null),
            targetTournamentName: (value, values) => {
                if (reportType === "tournament") {
                    if (!value || !value.trim()) return "Tournament name is required";
                    if (value.length < 5) return "Tournament name must be at least 5 characters";
                    if (value.length > 120) return "Tournament name cannot exceed 120 characters";
                    if (value && !values.targetTournamentLink) return "Forum URL is required for tournament reports";
                }
                return null;
            },
            targetTournamentLink: (value) => {
                if (reportType === "tournament") {
                    if (!value) return "Forum URL is required";
                    if (!utils.isOsuForumLink(value)) return "Invalid osu! forum URL format";
                }
                return null;
            },
        },
    });

    const handleReportTypeChange = (value: string | null) => {
        if (!value) return;

        const type = value as "user" | "tournament";
        setReportType(type);

        if (type === "user") {
            form.setValues({
                ...form.values,
                targetTournamentName: "",
                targetTournamentLink: "",
            });
        } else if (type === "tournament") {
            form.setValues({
                ...form.values,
                targetUserId: "",
            });
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload: {
                targetUserId?: string;
                targetTournamentName?: string;
                targetTournamentLink?: string;
            } = {};

            if (reportType === "user") {
                payload.targetUserId = values.targetUserId;
            } else {
                payload.targetTournamentName = values.targetTournamentName;
                payload.targetTournamentLink = values.targetTournamentLink;
            }

            await editTicketMutation.mutateAsync(payload);
            onClose();
        } catch (error) {
            console.error("Failed to edit report:", error);
        }
    };

    const handleClose = () => {
        form.reset();
        setReportType(ticket.targetUser ? "user" : "tournament");
        onClose();
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="Edit Report Target" size="lg">
            <LoadingOverlay
                visible={editTicketMutation.isPending}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Select
                        label="Report Type"
                        placeholder="Select report type"
                        data={[
                            { value: "user", label: "User Report" },
                            {
                                value: "tournament",
                                label: ticket.assignedGroup === "cc" ? "Contest Report" : "Tournament Report",
                            },
                        ]}
                        value={reportType}
                        onChange={handleReportTypeChange}
                        withAsterisk
                    />

                    {reportType === "user" && (
                        <UserSearch
                            label="Target User"
                            error={form.errors.targetUserId}
                            onChange={(user) => form.setFieldValue("targetUserId", user?.id || "")}
                            required
                            allowUserCreation
                            preloadUser={ticket.targetUser?.id}
                        />
                    )}

                    {reportType === "tournament" && (
                        <>
                            <TextInput
                                label={ticket.assignedGroup === "cc" ? "Contest Name" : "Tournament Name"}
                                placeholder={
                                    ticket.assignedGroup === "cc" ? "Enter contest name..." : "Enter tournament name..."
                                }
                                {...form.getInputProps("targetTournamentName")}
                                withAsterisk
                            />
                            <TextInput
                                label={ticket.assignedGroup === "cc" ? "Contest Forum URL" : "Tournament Forum URL"}
                                placeholder="https://osu.ppy.sh/community/forums/topics/..."
                                {...form.getInputProps("targetTournamentLink")}
                                withAsterisk
                            />
                        </>
                    )}

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={editTicketMutation.isPending}>
                            Save Changes
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
