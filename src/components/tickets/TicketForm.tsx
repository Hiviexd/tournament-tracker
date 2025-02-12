import { UseFormReturnType } from "@mantine/form";
import { Stack, TextInput, Textarea, Select, Card, Alert } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicketFormValues } from "../../pages/TicketCreatePage";
import MarkdownText from "../common/MarkdownText";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Content Committee" },
] as const;

interface IProps {
    form: UseFormReturnType<ITicketFormValues>;
    onSubmit: (values: ITicketFormValues) => void;
}

export default function TicketForm({ form }: IProps) {
    return (
        <Stack gap="md">
            <Alert color="info" title="Info" icon={<FontAwesomeIcon icon="info-circle" />}>
                <MarkdownText content="Tickets are used to reach out directly to the Tournament/Contest Committee. Whether you have a simple question or need help with a specific issue, open up a ticket!" />
            </Alert>

            <Alert color="warning" title="Warning" icon={<FontAwesomeIcon icon="exclamation-triangle" />}>
                <MarkdownText
                    content={`Tickets and their conversations are visible to the public! This is to provide an archive for users to look through when researching a specific issue or topic.

Try searching for your issue in the **[Tickets listing](/tickets)** before creating a new ticket!`}
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

                    <TextInput
                        label="Title"
                        placeholder="Enter ticket title"
                        {...form.getInputProps("title")}
                        withAsterisk
                    />

                    <Textarea
                        label="Message"
                        placeholder="Enter your message"
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
