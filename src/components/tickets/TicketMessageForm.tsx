import { useState } from "react";
import { ActionIcon, Card, Stack, Textarea, Group, Button, Tooltip, FileInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { useSendMessage, useToggleStatus } from "../../hooks/useTickets";
import { ITicket } from "../../../interfaces/Ticket";
import { useFileUpload } from "../../hooks/useFileUpload";
import { IMessageFormData } from "../../../interfaces/Message";
import { useAutoSave } from "../../hooks/useAutoSave";
import TextLengthIndicator from "../common/TextLengthIndicator";
import AutoSaveIndicator from "../common/AutoSaveIndicator";

interface IProps {
    ticket: ITicket;
}

export default function TicketMessageForm({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isNote, setIsNote] = useState(false);
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
    const toggleStatusMutation = useToggleStatus(ticket.id);

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

    const handleSubmit = async () => {
        const validationError = validateMessage(content);
        if (validationError) {
            setError(validationError);
            return;
        }

        const formData = new FormData() as IMessageFormData;
        formData.append("content", content);
        formData.append("isNote", isNote.toString());
        files.forEach((file) => formData.append("files", file));

        try {
            await createMessageMutation.mutateAsync(formData);
            clearContent();
            setError(null);
            clearFiles();
        } catch (err) {
            setError("Failed to send message. Please try again.");
        }
    };

    const handleToggleStatus = async () => {
        if (!window.confirm(`Are you sure you want to ${ticket.isActive ? "close" : "reopen"} this ticket?`)) return;
        await toggleStatusMutation.mutateAsync();
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Textarea
                    placeholder={
                        !ticket.isActive && !isNote
                            ? "Cannot message closed tickets"
                            : isNote
                                ? "Add a note..."
                                : "Type your message..."
                    }
                    disabled={!ticket.isActive && !isNote}
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
                <FileInput
                    accept=".jpg,.png,.zip,.rar,.txt"
                    multiple
                    leftSection={<FontAwesomeIcon icon="upload" />}
                    label="Attachments"
                    description="Up to 5 files (5MB each, allowed types: jpg, png, zip, rar, txt)"
                    placeholder="Upload files"
                    value={files}
                    onChange={handleFileChange}
                />
                <Group justify="space-between">
                    <Group>
                        <Button
                            color={isNote ? "info" : "primary"}
                            onClick={handleSubmit}
                            loading={createMessageMutation.isPending}
                            disabled={!!error || !content || (!ticket.isActive && !isNote)}
                            leftSection={<FontAwesomeIcon icon={isNote ? "sticky-note" : "paper-plane"} />}>
                            {isNote ? "Add Note" : "Send Message"}
                        </Button>
                    </Group>
                    {user?.isCommittee && (
                        <Group>
                            <Tooltip label={isNote ? "Switch to Message Mode" : "Switch to Note Mode"}>
                                <ActionIcon
                                    variant={isNote ? "filled" : "outline"}
                                    color="info"
                                    onClick={() => setIsNote(!isNote)}
                                    size="lg">
                                    <FontAwesomeIcon icon="sticky-note" />
                                </ActionIcon>
                            </Tooltip>
                            <Button
                                onClick={handleToggleStatus}
                                loading={toggleStatusMutation.isPending}
                                color={ticket.isActive ? "danger" : "warning"}
                                leftSection={<FontAwesomeIcon icon={ticket.isActive ? "lock" : "lock-open"} />}>
                                {ticket.isActive ? "Close Ticket" : "Reopen Ticket"}
                            </Button>
                        </Group>
                    )}
                </Group>
            </Stack>
        </Card>
    );
}
