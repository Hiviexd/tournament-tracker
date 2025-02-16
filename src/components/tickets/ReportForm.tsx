import { useState } from "react";
import { useForm } from "@mantine/form";
import { Stack, Select, Textarea, TextInput, Card, Alert, Group, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicketFormValues } from "../../pages/TicketCreatePage";
import MarkdownText from "../common/MarkdownText";
import UserSearch from "../common/UserSearch";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "../../hooks/useTickets";
import helpers from "../../helpers";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Contest Committee" },
] as const;

export default function ReportForm() {
    const navigate = useNavigate();
    const createTicketMutation = useCreateTicket();
    const [reportType, setReportType] = useState<"user" | "tournament">();

    const form = useForm<ITicketFormValues>({
        initialValues: {
            title: "",
            message: "",
            type: "report",
            assignedGroup: undefined,
            targetUserId: "",
            targetTournamentName: "",
            targetTournamentLink: "",
        },
        validate: {
            message: (value) => (!value ? "Message is required" : null),
            assignedGroup: (value) => (!value ? "Committee selection is required" : null),
            targetUserId: (value) => (reportType === "user" && !value ? "Target user is required" : null),
            targetTournamentName: (value, values) => {
                if (reportType === "tournament" && !value) {
                    return "Tournament name is required";
                }
                if (reportType === "tournament" && value && !values.targetTournamentLink) {
                    return "Forum URL is required for tournament reports";
                }
                return null;
            },
            targetTournamentLink: (value) => {
                if (reportType === "tournament") {
                    if (!value) return "Forum URL is required";
                    if (!helpers.isOsuForumLink(value)) return "Invalid osu! forum URL format";
                }
                return null;
            },
        },
    });

    // Clear irrelevant fields when report type changes
    const handleReportTypeChange = (value: string | null) => {
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

    const handleSubmit = form.onSubmit(async (values) => {
        await createTicketMutation.mutateAsync({
            ...values,
            type: "report",
        });
        navigate("/tickets");
    });

    return (
        <Stack gap="md">
            <Alert color="info" title="Info" icon={<FontAwesomeIcon icon="info-circle" />}>
                <MarkdownText
                    content={`Reports are used to notify committee members about concerning behavior from tournament participants or issues with tournament organization.

Reports are **private** and only visible to you and committee members.

You can report either:
- A **user** for behavior that violates tournament rules
- A **tournament** for organization/management issues

**Please provide as much detail as possible** (including screenshots, logs, etc.) to help the committee investigate the issue.`}
                />
            </Alert>

            <Card shadow="xs" padding="lg">
                <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                        <Select
                            label="Contact Group"
                            placeholder="Select which committee to contact"
                            data={GROUP_OPTIONS}
                            {...form.getInputProps("assignedGroup")}
                            withAsterisk
                        />

                        <Select
                            label="Report Type"
                            placeholder="Select report type"
                            data={[
                                { value: "user", label: "User Report" },
                                { value: "tournament", label: "Tournament Report" },
                            ]}
                            onChange={handleReportTypeChange}
                            withAsterisk
                        />

                        {reportType === "user" && (
                            <UserSearch
                                label="Target User"
                                error={form.errors.targetUserId}
                                onChange={(user) => form.setFieldValue("targetUserId", user?.id)}
                                required
                            />
                        )}

                        {reportType === "tournament" && (
                            <>
                                <TextInput
                                    label="Tournament Name"
                                    placeholder="Enter tournament name"
                                    {...form.getInputProps("targetTournamentName")}
                                    withAsterisk
                                />
                                <TextInput
                                    label="Tournament Forum URL"
                                    placeholder="Enter forum URL"
                                    {...form.getInputProps("targetTournamentLink")}
                                    withAsterisk
                                />
                            </>
                        )}

                        <Textarea
                            label="Message"
                            placeholder="Tell us about your issue"
                            minRows={6}
                            resize="vertical"
                            autosize
                            {...form.getInputProps("message")}
                            withAsterisk
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                type="submit"
                                leftSection={<FontAwesomeIcon icon="flag" />}
                                loading={createTicketMutation.isPending}>
                                Submit Report
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </Stack>
    );
}
