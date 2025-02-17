import { Card, Group, Stack, Text } from "@mantine/core";
import moment from "moment";
import { IMessage } from "../../../interfaces/Message";
import { ITicket } from "../../../interfaces/Ticket";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";

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

    return (
        <Card
            shadow="sm"
            p="lg"
            style={(theme) => ({
                borderLeft: `4px solid ${message.isCommittee ? theme.colors.primary[6] : theme.colors.blue[6]}`,
            })}>
            <Stack gap="sm">
                <Group justify="space-between" align="center">
                    <UserDisplay {...getUserDisplayProps()} />
                    <Text size="sm" c="dimmed">
                        {moment(message.createdAt).format("LLL")}
                    </Text>
                </Group>
                <MarkdownText content={message.content} />
            </Stack>
        </Card>
    );
}
