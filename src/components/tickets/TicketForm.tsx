import { useForm } from "@mantine/form";
import { Stack, TextInput, Textarea, Select, Card, Alert, Group, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicketFormValues } from "../../pages/TicketCreatePage";
import MarkdownText from "../common/MarkdownText";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "../../hooks/useTickets";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Contest Committee" },
] as const;

export default function TicketForm() {
    const navigate = useNavigate();
    const createTicketMutation = useCreateTicket();

    const form = useForm<ITicketFormValues>({
        initialValues: {
            title: "",
            message: "",
            type: "ticket",
        },
        validate: {
            title: (value) => {
                if (!value.trim()) return "Title is required";
                if (value.length < 5) return "Title must be at least 5 characters";
                if (value.length > 80) return "Title cannot exceed 80 characters";
                return null;
            },
            message: (value) => {
                if (!value.trim()) return "Message is required";
                if (value.length < 10) return "Message must be at least 10 characters";
                if (value.length > 6000) return "Message cannot exceed 6000 characters";
                return null;
            },
            assignedGroup: (value) => (!value ? "Committee selection is required" : null),
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        await createTicketMutation.mutateAsync({
            ...values,
            type: "ticket",
        });
        navigate("/tickets");
    });

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
                <form onSubmit={handleSubmit}>
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
                            description={`${form.values.title.length}/80`}
                        />

                        <Textarea
                            label="Message"
                            placeholder="Enter your message"
                            minRows={6}
                            resize="vertical"
                            autosize
                            {...form.getInputProps("message")}
                            withAsterisk
                            description={`${form.values.message.length}/6000`}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                type="submit"
                                leftSection={<FontAwesomeIcon icon="paper-plane" />}
                                loading={createTicketMutation.isPending}>
                                Submit Ticket
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </Stack>
    );
}
