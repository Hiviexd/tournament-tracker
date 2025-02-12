import { useState } from "react";
import { UseFormReturnType } from "@mantine/form";
import { Stack, Select, Textarea, TextInput } from "@mantine/core";
import { ITicketFormValues } from "../../pages/TicketCreatePage";
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
                minRows={4}
                {...form.getInputProps("message")}
                withAsterisk
            />
        </Stack>
    );
}
