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
    const createMessageMutation = useSendMessage(ticket.id);

    const handleSubmit = async () => {
        await createMessageMutation.mutateAsync({
            content,
            isNote,
        });
        setContent("");
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Textarea
                    placeholder={isNote ? "Add a note..." : "Type your message..."}
                    minRows={3}
                    value={content}
                    onChange={(e) => setContent(e.currentTarget.value)}
                />
                <Group justify="space-between">
                    <Group>
                        <Button
                            color={isNote ? "info" : "primary"}
                            onClick={handleSubmit}
                            loading={createMessageMutation.isPending}
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
                            <Button color="red" leftSection={<FontAwesomeIcon icon="lock" />}>
                                Close Ticket
                            </Button>
                        </Group>
                    )}
                </Group>
            </Stack>
        </Card>
    );
}
