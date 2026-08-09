import {
    Card,
    Group,
    Stack,
    Alert,
    Text,
    ThemeIcon,
    Menu,
    ActionIcon,
    Box,
    useMantineTheme,
    MantineTheme,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IMessage } from "@tc/types/Message";
import { ITicket } from "@tc/types/Ticket";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import DateBadge from "../common/badges/DateBadge";
import AttachmentDisplay from "../common/AttachmentDisplay";
import UserLink from "../common/UserLink";
import utils from "@tc/utils/client";
import { useMediaQuery } from "@mantine/hooks";

interface IProps {
    ticket?: ITicket;
    message: IMessage;
    showTrueAuthor: boolean;
}

/** When to use committee identity over the true author */
type CommitteeIdentityDisplay = "always" | "whenMasked";

function getTicketMessageUserDisplayProps(
    ticket: ITicket | undefined,
    message: IMessage,
    committeeIdentityDisplay: CommitteeIdentityDisplay,
    showTrueAuthor: boolean,
) {
    const showCommitteeFacade = message.isCommittee && (committeeIdentityDisplay === "always" || !showTrueAuthor);
    if (showCommitteeFacade) {
        return {
            username: ticket?.assignedGroup === "tc" ? "Tournament Committee" : "Contest Committee",
            avatarUrl: "/assets/logo-512.png",
            group: ticket?.assignedGroup,
        };
    }
    return {
        user: message.author,
    };
}

function getTicketMessageBorderColor(ticket: ITicket | undefined, message: IMessage, theme: MantineTheme) {
    if (message.isCommittee) {
        if (ticket?.assignedGroup === "tc") return theme.colors.warning[6];
        if (ticket?.assignedGroup === "cc") return theme.colors.info[6];
    }
    return "var(--mantine-color-primary-light-color)";
}

function TicketMessageBody({
    ticket,
    message,
    showTrueAuthor,
    mobileNoteIcon = false,
    committeeIdentityDisplay,
}: {
    ticket?: ITicket;
    message: IMessage;
    showTrueAuthor: boolean;
    mobileNoteIcon?: boolean;
    committeeIdentityDisplay: CommitteeIdentityDisplay;
}) {
    const displayProps = getTicketMessageUserDisplayProps(ticket, message, committeeIdentityDisplay, showTrueAuthor);

    return (
        <Stack gap="sm">
            <Group justify="space-between" align="center">
                <UserDisplay {...displayProps} />
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
            {committeeIdentityDisplay === "always" && message.isCommittee && showTrueAuthor && (
                <Text size="xs" c="dimmed">
                    sent by <UserLink user={message.author} fw={700} c="white" />
                </Text>
            )}
            {message.attachments && message.attachments.length > 0 && (
                <Stack mt="lg" gap="sm">
                    <Text size="sm" c="grey">
                        Attachments
                    </Text>
                    <AttachmentDisplay attachments={message.attachments} />
                </Stack>
            )}
        </Stack>
    );
}

export default function TicketMessage({ ticket, message, showTrueAuthor }: IProps) {
    const theme = useMantineTheme();
    const mobileNoteIcon = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);

    // Notes
    // TODO: split into its own component and make mobile ver less ass
    if (message.isNote && showTrueAuthor) {
        return (
            <Alert
                radius="md"
                variant="light"
                color="info"
                icon={!mobileNoteIcon && <FontAwesomeIcon icon="sticky-note" />}>
                <TicketMessageBody
                    ticket={ticket}
                    message={message}
                    showTrueAuthor={showTrueAuthor}
                    mobileNoteIcon={mobileNoteIcon ?? false}
                    committeeIdentityDisplay="whenMasked"
                />
            </Alert>
        );
    }
    // Event logs
    if (message.event && ticket) {
        const isClosing = message.event === "close";
        const eventLogUserDisplay = getTicketMessageUserDisplayProps(ticket, message, "whenMasked", showTrueAuthor);
        const committeeFacade = "username" in eventLogUserDisplay ? eventLogUserDisplay.username : undefined;
        return (
            <Group gap="xs" align="center" mx="lg">
                <ThemeIcon size="sm" radius="xl" color={isClosing ? "red" : "green"} variant="filled">
                    <FontAwesomeIcon icon={isClosing ? "lock" : "lock-open"} size="xs" />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                    <UserLink user={message.author} username={committeeFacade} asText={!!committeeFacade} c="white" />{" "}
                    {isClosing ? "closed" : "reopened"} this {ticket.isTicket ? "ticket" : "report"}{" "}
                    <DateBadge date={message.createdAt} staticColor size="sm" />
                </Text>
            </Group>
        );
    }
    // Regular message
    if (!message.isNote) {
        return (
            <Card
                shadow="sm"
                p="lg"
                radius="md"
                style={(t) => ({
                    borderLeft: `4px solid ${getTicketMessageBorderColor(ticket, message, t)}`,
                })}>
                <TicketMessageBody
                    ticket={ticket}
                    message={message}
                    showTrueAuthor={showTrueAuthor}
                    committeeIdentityDisplay="always"
                />
            </Card>
        );
    }
}
