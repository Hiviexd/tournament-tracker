import { useState } from "react";
import { Card, Stack, Textarea, Group, Button, Switch } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { useSendMessage } from "../../hooks/useTickets";

interface IProps {
    ticketId: string;
}

export default function TicketMessageForm({ ticketId }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [content, setContent] = useState("");
    const [isNote, setIsNote] = useState(false);
    const createMessageMutation = useSendMessage(ticketId);

    const handleSubmit = async () => {
        await createMessageMutation.mutateAsync({
            content,
            //isNote: user?.isCommittee ? isNote : false,
        });
        setContent("");
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Textarea
                    placeholder="Type your message..."
                    minRows={3}
                    value={content}
                    onChange={(e) => setContent(e.currentTarget.value)}
                />
                <Group justify="space-between">
                    {user?.isCommittee && (
                        <Switch
                            label="Mark as note"
                            checked={isNote}
                            onChange={(e) => setIsNote(e.currentTarget.checked)}
                        />
                    )}
                    <Button
                        onClick={handleSubmit}
                        loading={createMessageMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="paper-plane" />}>
                        Send
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
