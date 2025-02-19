import { useState } from "react";
import { ActionIcon, Card, Stack, Textarea, Group, Button, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { useSendMessage } from "../../hooks/useTickets";
import { ITicket } from "../../../interfaces/Ticket";

interface IProps {
    ticket: ITicket;
}

export default function TicketMessageForm({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isNote, setIsNote] = useState(false);
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
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

    const handleSubmit = async () => {
        const validationError = validateMessage(content);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            await createMessageMutation.mutateAsync({
                content,
                isNote,
            });
            setContent("");
            setError(null);
        } catch (err) {
            setError("Failed to send message. Please try again.");
        }
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
                    description={`${content.length}/6000`}
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
