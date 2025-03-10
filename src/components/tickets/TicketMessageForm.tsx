import { useState } from "react";
import { Card, Stack, Group, Button, Text, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSendMessage } from "../../hooks/useTickets";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { ITicket } from "../../../interfaces/Ticket";
import { useFileUpload } from "../../hooks/useFileUpload";
import { IMessageFormData } from "../../../interfaces/Message";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import TextLengthIndicator from "../common/TextLengthIndicator";
import FileUploadInput from "../common/FileUploadInput";
import TextEditor from "../common/TextEditor";

interface IProps {
    ticket: ITicket;
}

export default function TicketMessageForm({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submissionCount, setSubmissionCount] = useState(0);
    const { files, handleFileChange, clearFiles } = useFileUpload();
    const createMessageMutation = useSendMessage(ticket.id);
    const autoSaveKey = `ticket-message-${ticket.id}`;

    const validateMessage = (message: string): string | null => {
        if (!message.trim()) return "Message is required";
        if (message.length < 10) return "Message must be at least 10 characters";
        if (message.length > 6000) return "Message cannot exceed 6000 characters";
        return null;
    };

    const getPlaceholder = () => {
        if (!ticket.isActive && !user?.isCommittee) return "Cannot message closed tickets";
        if (!ticket.isActive && user?.isCommittee) return "Type your note...";
        return "Type your message...";
    };

    const handleContentChange = (value: string) => {
        setContent(value);
        if (error) setError(null);
    };

    const handleSubmit = async (isNote: boolean) => {
        const validationError = validateMessage(content);
        if (validationError) {
            setError(validationError);
            return;
        }

        const formData = new FormData() as IMessageFormData;
        formData.append("content", content);
        formData.append("isNote", isNote.toString());
        files.forEach((file) => formData.append("files", file));

        if (user?.isCommittee) {
            const confirmed = window.confirm(
                `Are you sure you want to ${
                    isNote ? "add a note" : "send a message"
                }? Please double check your selection.`
            );
            if (!confirmed) return;
        }

        try {
            await createMessageMutation.mutateAsync(formData);
            clearAutoSavedValue(autoSaveKey);
            setContent("");
            setError(null);
            clearFiles();

            // force a re-render of the TextEditor component to visually clear the content
            setSubmissionCount((count) => count + 1);
        } catch (err) {
            setError("Failed to send message. Please try again.");
        }
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Box>
                    <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                            Message
                        </Box>
                        <TextLengthIndicator length={content.length} maxLength={6000} />
                    </Box>
                    <TextEditor
                        key={`${ticket.id}-${submissionCount}`}
                        value={content}
                        onChange={handleContentChange}
                        placeholder={getPlaceholder()}
                        disabled={!ticket.isActive && !user?.isCommittee}
                        minHeight={120}
                        className={error ? "error" : ""}
                        autoSaveKey={autoSaveKey}
                    />
                    {error && (
                        <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                            {error}
                        </Box>
                    )}
                </Box>
                <FileUploadInput value={files} onChange={handleFileChange} />
                <Group justify="end" align="center">
                    {user?.isCommittee && (
                        <Text fs="italic" size="xs" c="dimmed">
                            Notes are only visible to committee members
                        </Text>
                    )}
                    <Group>
                        {user?.isCommittee && (
                            <Button
                                color="info"
                                onClick={() => handleSubmit(true)}
                                loading={createMessageMutation.isPending}
                                disabled={!!error || !content}
                                leftSection={<FontAwesomeIcon icon="sticky-note" />}>
                                Add Note
                            </Button>
                        )}
                        <Button
                            color="primary"
                            onClick={() => handleSubmit(false)}
                            loading={createMessageMutation.isPending}
                            disabled={!!error || !content || !ticket.isActive}
                            leftSection={<FontAwesomeIcon icon="paper-plane" />}>
                            Send Message
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}
