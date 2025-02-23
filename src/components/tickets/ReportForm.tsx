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
import { useFileUpload } from "../../hooks/useFileUpload";
import { type TicketFormData } from "../../../interfaces/Ticket";
import TextLengthIndicator from "../common/TextLengthIndicator";
import FileUploadInput from "../common/FileUploadInput";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Contest Committee" },
] as const;

export default function ReportForm() {
    const navigate = useNavigate();
    const createTicketMutation = useCreateTicket();
    const [reportType, setReportType] = useState<"user" | "tournament">();
    const { files, handleFileChange } = useFileUpload();

    const form = useForm<ITicketFormValues>({
        initialValues: {
            title: "",
            message: "",
            type: "report",
            assignedGroup: undefined,
            targetUserId: "",
            targetTournamentName: "",
            targetTournamentLink: "",
            reportType: undefined as "user" | "tournament" | undefined,
        },
        validate: {
            message: (value) => {
                if (!value || !value.trim()) return "Message is required";
                if (value.length < 10) return "Message must be at least 10 characters";
                if (value.length > 6000) return "Message cannot exceed 6000 characters";
                return null;
            },
            assignedGroup: (value) => (!value ? "Committee selection is required" : null),
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
                    if (!helpers.isOsuForumLink(value)) return "Invalid osu! forum URL format";
                }
                return null;
            },
            reportType: (value: string | null | undefined) => {
                if (!value || !["user", "tournament"].includes(value)) {
                    return "Report type is required";
                }
                return null;
            },
        },
    });

    // Clear irrelevant fields when report type changes
    const handleReportTypeChange = (value: string | null) => {
        if (!value) return;

        const type = value as "user" | "tournament";
        setReportType(type);
        form.setFieldValue("reportType", type);

        if (type === "user") {
            form.setValues({
                ...form.values,
                reportType: type,
                targetTournamentName: "",
                targetTournamentLink: "",
            });
        } else if (type === "tournament") {
            form.setValues({
                ...form.values,
                reportType: type,
                targetUserId: "",
            });
        }
    };

    const handleSubmit = form.onSubmit(async (values) => {
        const formData = new FormData() as TicketFormData;

        // Remove type from values since we're adding it explicitly
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, reportType, ...restValues } = values;

        // Add form fields with null/undefined checks
        Object.entries(restValues).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                formData.append(key, value.toString());
            }
        });

        // Add type explicitly
        formData.append("type", "report");

        // Add files
        files.forEach((file) => formData.append("files", file));

        try {
            await createTicketMutation.mutateAsync(formData);
            navigate("/reports");
        } catch (error) {
            console.error("Failed to create report:", error);
        }
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
                            {...form.getInputProps("reportType")}
                            onChange={(value) => {
                                form.setFieldValue("reportType", value as "user" | "tournament");
                                handleReportTypeChange(value);
                            }}
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
                            description={
                                <TextLengthIndicator
                                    length={form.values.message.length}
                                    maxLength={6000}
                                />
                            }
                        />

                        <FileUploadInput value={files} onChange={handleFileChange} />

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
