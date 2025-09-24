import { Card, Group, Stack, Alert, Text, ThemeIcon, Menu, ActionIcon, Box, useMantineTheme } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IMessage } from "../../../interfaces/Message";
import { ITicket } from "../../../interfaces/Ticket";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import DateBadge from "../common/badges/DateBadge";
import AttachmentDisplay from "../common/AttachmentDisplay";
import UserLink from "../common/UserLink";
import utils from "../../../utils";
import { useMediaQuery } from "@mantine/hooks";

interface IProps {
    ticket?: ITicket;
    message: IMessage;
    showTrueAuthor: boolean;
}

export default function TicketMessage({ ticket, message, showTrueAuthor }: IProps) {
    const theme = useMantineTheme();
    const mobileNoteIcon = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);

    const getUserDisplayProps = () => {
        if (message.isCommittee && !showTrueAuthor) {
            return {
                username: ticket?.assignedGroup === "tc" ? "Tournament Committee" : "Contest Committee",
                avatarUrl: "/assets/logo-512.png",
                group: ticket?.assignedGroup,
            };
        }
        return {
            user: message.author,
        };
    };

    const getBorderColor = (theme: any) => {
        if (message.isCommittee) {
            if (ticket?.assignedGroup === "tc") return theme.colors.warning[6];
            if (ticket?.assignedGroup === "cc") return theme.colors.info[6];
        }
        return theme.colors.primary[6];
    };

    const MessageContent = ({ mobileNoteIcon = false }: { mobileNoteIcon?: boolean }) => (
        <Stack gap="sm">
            <Group justify="space-between" align="center">
                <UserDisplay {...getUserDisplayProps()} />
                <Group gap="xs">
                    <Box visibleFrom="xs">
                        <DateBadge date={message.createdAt} staticColor />
                    </Box>
                    {mobileNoteIcon && (
                        <FontAwesomeIcon icon="sticky-note" color="var(--mantine-color-info-light-color)" />
                    )}
                    <Menu position="bottom-end" withArrow>
                        <Menu.Target>
                            <ActionIcon size="sm" variant="subtle">
                                <FontAwesomeIcon icon="ellipsis-vertical" />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<FontAwesomeIcon icon="copy" />}
                                onClick={() => utils.copyToClipboard(message.content)}>
                                Copy Message
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Group>
            <Box hiddenFrom="xs">
                <DateBadge date={message.createdAt} staticColor />
            </Box>
            <Box style={{ overflowWrap: "anywhere" }}>
                <MarkdownText content={message.content} />
            </Box>
            {message.attachments && message.attachments.length > 0 && (
                <Stack mt="lg" gap="sm">
                    <Text size="sm" c="grey">
                        Attachments
                    </Text>
                    <Group gap="sm">
                        {message.attachments.map((attachment) => (
                            <AttachmentDisplay key={attachment.id} attachment={attachment} />
                        ))}
                    </Group>
                </Stack>
            )}
        </Stack>
    );

    // Notes
    // TODO: split into its own component and make mobile ver less ass
    if (message.isNote && showTrueAuthor) {
        return (
            <Alert
                radius="md"
                variant="light"
                color="info"
                icon={!mobileNoteIcon && <FontAwesomeIcon icon="sticky-note" />}>
                <MessageContent mobileNoteIcon={mobileNoteIcon} />
            </Alert>
        );
    // Event logs
    } else if (message.event && ticket) {
        const isClosing = message.event === "close";
        return (
            <Group gap="xs" align="center" mx="lg">
                <ThemeIcon size="sm" radius="xl" color={isClosing ? "red" : "green"} variant="filled">
                    <FontAwesomeIcon icon={isClosing ? "lock" : "lock-open"} size="xs" />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                    <UserLink
                        user={message.author}
                        username={getUserDisplayProps().username}
                        asText={!!getUserDisplayProps().username}
                        c="white"
                    />{" "}
                    {isClosing ? "closed" : "reopened"} this {ticket.isTicket ? "ticket" : "report"}{" "}
                    <DateBadge date={message.createdAt} staticColor size="sm" />
                </Text>
            </Group>
        );
        // Regular message
    } else if (!message.isNote) {
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
}
