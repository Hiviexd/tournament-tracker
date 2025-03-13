import { useForm } from "@mantine/form";
import { Stack, TextInput, Select, Card, Alert, Group, Button, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicketFormValues } from "../../pages/TicketCreatePage";
import MarkdownText from "../common/MarkdownText";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "../../hooks/useTickets";
import { useFileUpload } from "../../hooks/useFileUpload";
import { type TicketFormData } from "../../../interfaces/Ticket";
import TextLengthIndicator from "../common/TextLengthIndicator";
import FileUploadInput from "../common/FileUploadInput";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import SignInBanner from "../common/SignInBanner";
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Contest Committee" },
] as const;

export default function TicketForm() {
    const navigate = useNavigate();
    const createTicketMutation = useCreateTicket();
    const { files, handleFileChange } = useFileUpload();
    const [user] = useAtom(loggedInUserAtom);
    const autoSaveKey = "ticket-create-form-message";

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
        const formData = new FormData() as TicketFormData;

        // Remove type from values since we're adding it explicitly
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, ...restValues } = values;

        // Add form fields
        Object.entries(restValues).forEach(([key, value]) => {
            if (value) formData.append(key, value.toString());
        });

        // Add type separately
        formData.append("type", "ticket");

        // Add files with correct field name
        files.forEach((file) => formData.append("files", file));

        try {
            await createTicketMutation.mutateAsync(formData);

            // Clear the autosaved text after successful submission
            clearAutoSavedValue(autoSaveKey);

            navigate("/tickets");
        } catch (error) {
            console.error("Failed to create ticket:", error);
        }
    });

    return (
        <Stack gap="md">
            <Alert color="info" title="Info" icon={<FontAwesomeIcon icon="info-circle" />}>
                <MarkdownText content="Tickets are used to reach out directly to the Tournament/Contest Committee. Whether you have a simple question or need help with a specific issue, open up a ticket!" />
            </Alert>

            <Alert color="warning" title="Warning" icon={<FontAwesomeIcon icon="exclamation-triangle" />}>
                <MarkdownText
                    content={`Tickets and their conversations are visible to the public! This is to provide an archive for users to look through when researching a specific issue or topic.

Try searching for your issue in the [**Tickets listing**](/tickets) before creating a new ticket!`}
                />
            </Alert>

            {!user && <SignInBanner text="You need to sign in with your osu! account to submit tickets." />}

            <Card shadow="xs" padding="lg">
                <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                        <Select
                            label="Contact Group"
                            placeholder="Select which committee to contact"
                            data={GROUP_OPTIONS}
                            {...form.getInputProps("assignedGroup")}
                            withAsterisk
                            disabled={!user}
                        />

                        <TextInput
                            label="Title"
                            placeholder="Enter ticket title"
                            {...form.getInputProps("title")}
                            withAsterisk
                            disabled={!user}
                            description={<TextLengthIndicator length={form.values.title.length} maxLength={80} />}
                        />

                        <Box>
                            <Box
                                mb={5}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                    Message<span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                                </Box>
                                <TextLengthIndicator length={form.values.message.length} maxLength={6000} />
                            </Box>
                            <TextEditor
                                value={form.values.message}
                                onChange={(value) => form.setFieldValue("message", value)}
                                placeholder="Enter your message"
                                minHeight={200}
                                className={form.errors.message ? "error" : ""}
                                disabled={!user}
                                autoSaveKey={autoSaveKey}
                            />
                            {form.errors.message && (
                                <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                    {form.errors.message}
                                </Box>
                            )}
                        </Box>

                        <FileUploadInput value={files} onChange={handleFileChange} disabled={!user} />

                        <Group justify="flex-end" mt="md">
                            <Button
                                type="submit"
                                leftSection={<FontAwesomeIcon icon="paper-plane" />}
                                loading={createTicketMutation.isPending}
                                disabled={!user}>
                                Submit Ticket
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </Stack>
    );
}
