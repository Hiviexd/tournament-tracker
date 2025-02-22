import { Card, Group, Stack, Alert, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IMessage } from "../../../interfaces/Message";
import { ITicket } from "../../../interfaces/Ticket";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import DateBadge from "../common/badges/DateBadge";
import AttachmentDisplay from "../common/AttachmentDisplay";

interface IProps {
    ticket: ITicket;
    message: IMessage;
    showTrueAuthor: boolean;
}

export default function TicketMessage({ ticket, message, showTrueAuthor }: IProps) {
    const getUserDisplayProps = () => {
        if (message.isCommittee && !showTrueAuthor) {
            return {
                username: ticket.assignedGroup === "tc" ? "Tournament Committee" : "Contest Committee",
                avatarUrl: "/assets/logo-512.png",
                group: ticket.assignedGroup,
            };
        }
        return {
            user: message.author,
        };
    };

    const getBorderColor = (theme: any) => {
        if (message.isCommittee) {
            if (ticket.assignedGroup === "tc") return theme.colors.warning[6];
            if (ticket.assignedGroup === "cc") return theme.colors.info[6];
        }
        return theme.colors.primary[6];
    };

    const MessageContent = () => (
        <Stack gap="sm">
            <Group justify="space-between" align="center">
                <UserDisplay {...getUserDisplayProps()} />
                <DateBadge date={message.createdAt} staticColor />
            </Group>
            <MarkdownText content={message.content} />
            {message.attachments && message.attachments.length > 0 && (
                <Stack mt="lg" gap="sm">
                    <Text size="sm" c="grey">
                        Attachments
                    </Text>
                    <Group gap="sm">
                        {message.attachments.map((attachment) => (
                            <AttachmentDisplay key={attachment._id} attachment={attachment} />
                        ))}
                    </Group>
                </Stack>
            )}
        </Stack>
    );

    if (message.isNote && showTrueAuthor) {
        return (
            <Alert radius="md" variant="light" color="info" icon={<FontAwesomeIcon icon="sticky-note" />}>
                <MessageContent />
            </Alert>
        );
    } else if (!message.isNote)
        return (
            <Card
                shadow="sm"
                p="lg"
                radius="md"
                style={(theme) => ({
                    borderLeft: `4px solid ${getBorderColor(theme)}`,
                })}>
                <MessageContent />
            </Card>
        );
}
