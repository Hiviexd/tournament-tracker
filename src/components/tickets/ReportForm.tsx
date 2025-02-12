import { useState } from "react";
import { UseFormReturnType } from "@mantine/form";
import { Stack, Select, Textarea, TextInput, Card, Alert } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicketFormValues } from "../../pages/TicketCreatePage";
import MarkdownText from "../common/MarkdownText";
import UserSearch from "../common/UserSearch";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Content Committee" },
] as const;

interface IProps {
    form: UseFormReturnType<ITicketFormValues>;
    onSubmit: (values: ITicketFormValues) => void;
}

export default function ReportForm({ form }: IProps) {
    const [reportType, setReportType] = useState<"user" | "tournament">();

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
                        onChange={(value) => setReportType(value as "user" | "tournament")}
                        withAsterisk
                    />

                    {reportType === "user" && (
                        <UserSearch
                            label="Target User"
                            error={form.errors.targetUser}
                            onChange={(user) => form.setFieldValue("targetUser", user?.id)}
                            required
                        />
                    )}

                    {reportType === "tournament" && (
                        <>
                            <TextInput
                                label="Tournament Name"
                                placeholder="Enter tournament name"
                                {...form.getInputProps("tournamentName")}
                                withAsterisk
                            />
                            <TextInput
                                label="Tournament Forum URL"
                                placeholder="Enter forum URL"
                                {...form.getInputProps("forumUrl")}
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
                </Stack>
            </Card>
        </Stack>
    );
}
