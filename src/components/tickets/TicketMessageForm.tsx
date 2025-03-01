import { useState } from "react";
import { Card, Stack, Textarea, Group, Button, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSendMessage } from "../../hooks/useTickets";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { ITicket } from "../../../interfaces/Ticket";
import { useFileUpload } from "../../hooks/useFileUpload";
import { IMessageFormData } from "../../../interfaces/Message";
import { useAutoSave } from "../../hooks/useAutoSave";
import TextLengthIndicator from "../common/TextLengthIndicator";
import AutoSaveIndicator from "../common/AutoSaveIndicator";
import FileUploadInput from "../common/FileUploadInput";

interface IProps {
    ticket: ITicket;
}

export default function TicketMessageForm({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const {
        value: content,
        setValue: setContent,
        clear: clearContent,
        isSaved,
    } = useAutoSave({
        key: `ticket-message-${ticket.id}`,
        debounceMs: 500,
    });
    const [error, setError] = useState<string | null>(null);
    const { files, handleFileChange, clearFiles } = useFileUpload();
    const createMessageMutation = useSendMessage(ticket.id);

    const validateMessage = (message: string): string | null => {
        if (!message.trim()) return "Message is required";
        if (message.length < 10) return "Message must be at least 10 characters";
        if (message.length > 6000) return "Message cannot exceed 6000 characters";
        return null;
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
            clearContent();
            setError(null);
            clearFiles();
        } catch (err) {
            setError("Failed to send message. Please try again.");
        }
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Textarea
                    placeholder={
                        !ticket.isActive && !user?.isCommittee
                            ? "Cannot message closed tickets"
                            : "Type your message..."
                    }
                    disabled={!ticket.isActive && !user?.isCommittee}
                    minRows={3}
                    resize="vertical"
                    autosize
                    value={content}
                    onChange={(e) => handleContentChange(e.currentTarget.value)}
                    error={error}
                    description={
                        <Group gap={4} justify="flex-start" align="center">
                            <TextLengthIndicator length={content.length} maxLength={6000} />
                            <AutoSaveIndicator isSaved={isSaved} />
                        </Group>
                    }
                />
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
                            disabled={
                                !!error || !content || !ticket.isActive
                            }
                            leftSection={<FontAwesomeIcon icon="paper-plane" />}>
                            Send Message
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}
