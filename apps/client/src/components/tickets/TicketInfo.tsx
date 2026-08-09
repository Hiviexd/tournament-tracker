import { DISCORD_SERVER_ID } from "../../constants";
import {
    Card,
    Group,
    Stack,
    Text,
    Badge,
    Tooltip,
    Title,
    Anchor,
    Button,
    Input,
    ActionIcon,
    Divider,
    FocusTrap,
    useMantineTheme,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicket } from "@tc/types/Ticket";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import DateBadge from "../common/badges/DateBadge";
import UserCard from "../common/UserCard";
import { IUser } from "@tc/types/User";
import { useSnoozeTicket, useToggleStatus, useUpdateThreadId } from "../../hooks/useTickets";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import dayjs from "@tc/utils/dayjs";
import { useState } from "react";
import CopyActionIcon from "@components/common/buttons/CopyActionIcon";
import { useConfirmModal } from "../../hooks/useModals";
import AlertText from "../common/AlertText";
import { useMediaQuery } from "@mantine/hooks";
import ReportEditModal from "./ReportEditModal";

interface IProps {
    ticket: ITicket;
}

export default function TicketInfo({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);

    const [threadId, setThreadId] = useState(ticket.threadId);
    const [isUpdatingThreadId, setIsUpdatingThreadId] = useState(false);
    const [editModalOpened, setEditModalOpened] = useState(false);
    const isEditableReport = ticket.isReport && !ticket.isActive && user?.isCommitteeOrAdmin;

    const toggleStatusMutation = useToggleStatus(ticket.id);
    const updateThreadIdMutation = useUpdateThreadId(ticket.id);
    const snoozeTicketMutation = useSnoozeTicket(ticket.id);
    const confirmModal = useConfirmModal();

    const threadLink = `https://discord.com/channels/${DISCORD_SERVER_ID}/${ticket.threadId ?? ""}`;

    const getStatusColor = (): string => {
        if (!ticket.isActive) return "danger";

        const updatedDays = dayjs().diff(dayjs(ticket.lastResponseAt), "days");
        if (updatedDays >= 10) return "danger";
        if (updatedDays >= 7) return "warning";
        return "success";
    };

    const handleToggleStatus = async () => {
        if (
            !(await confirmModal({
                title: `${ticket.isActive ? "Close" : "Reopen"} ${ticket.type}?`,
                text: `Are you sure you want to ${ticket.isActive ? "close" : "reopen"} this ${ticket.type}?`,
                confirmText: ticket.isActive ? "Close" : "Reopen",
                confirmProps: {
                    color: ticket.isActive ? "warning" : "success",
                    leftSection: <FontAwesomeIcon icon={ticket.isActive ? "lock" : "lock-open"} />,
                },
            }))
        )
            return;
        await toggleStatusMutation.mutateAsync();
    };

    const handleSnoozeTicket = async () => {
        const message = (
            <>
                <Text size="sm" mb="sm">
                    Are you sure you want to snooze reminders for 7 days?
                </Text>
                <AlertText type="info">
                    Reminders will resume after that time period, or when a new message is sent.
                </AlertText>
            </>
        );
        if (
            !(await confirmModal({
                title: "Snooze Reminders?",
                children: message,
                confirmText: "Snooze Reminders",
                confirmProps: { leftSection: <FontAwesomeIcon icon="moon" />, color: "warning" },
            }))
        )
            return;
        await snoozeTicketMutation.mutateAsync();
    };

    const handleUserCardClick = (targetUser: IUser) => {
        window.open(`https://osu.ppy.sh/users/${targetUser.osuId}`, "_blank");
    };

    const handleUpdateThreadId = async () => {
        await updateThreadIdMutation.mutateAsync(threadId ?? "");
        setIsUpdatingThreadId(false);
    };

    return (
        <Card
            shadow="sm"
            p="lg"
            radius="md"
            className="ticket-info"
            data-active={ticket.isActive}
            style={
                ticket.isActive
                    ? {
                          ["--card-status-color" as any]: `var(--mantine-color-${getStatusColor()}-6)`,
                      }
                    : undefined
            }>
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={4}>
                        <Text size="xl" fw={700}>
                            {ticket.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                            Created by <UserLink user={ticket.author} /> • Last updated{" "}
                            <DateBadge
                                date={ticket.lastResponseAt}
                                warningAge={7}
                                dangerAge={10}
                                staticColor={!ticket.isActive}
                                size="sm"
                            />
                        </Text>
                    </Stack>
                    <Group gap="xs">
                        <Tooltip label={ticket.type === "ticket" ? "Ticket" : "Report"}>
                            <Badge color={ticket.type === "ticket" ? "info" : "red"} variant="light">
                                <FontAwesomeIcon icon={ticket.type === "ticket" ? "paper-plane" : "flag"} />
                            </Badge>
                        </Tooltip>
                        <UserGroupBadge group={ticket.assignedGroup} tooltip="top" variant="light" />
                        <Badge variant="light" color={ticket.isActive ? "success" : "danger"}>
                            {ticket.isActive ? "Active" : "Closed"}
                        </Badge>
                    </Group>
                </Group>
                {ticket.targetUser && (
                    <Stack gap="xs">
                        <Group align="center">
                            <Title order={5}>Reported User</Title>
                            {isEditableReport && (
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => setEditModalOpened(true)}
                                    color="info"
                                    title="Edit report target">
                                    <FontAwesomeIcon icon="pen-to-square" />
                                </ActionIcon>
                            )}
                        </Group>
                        <UserCard static user={ticket.targetUser} onSelect={handleUserCardClick} fullWidth={isMobile} />
                    </Stack>
                )}
                {ticket.targetTournamentName && (
                    <Group align="center">
                        <Text fw={700}>
                            Reported Tournament:{" "}
                            <Anchor href={ticket.targetTournamentLink} target="_blank" rel="noopener noreferrer">
                                {ticket.targetTournamentName}
                            </Anchor>
                        </Text>
                        {isEditableReport && (
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setEditModalOpened(true)}
                                color="info"
                                title="Edit report target">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                        )}
                    </Group>
                )}
                {user?.isCommittee && (
                    <Stack gap="xs">
                        <Divider my="xs" />
                        <Stack gap="xs">
                            <Group gap="xs">
                                <Text size="sm" fw={700}>
                                    Discord Thread ID:
                                </Text>
                                {isUpdatingThreadId ? (
                                    <FocusTrap active={isUpdatingThreadId}>
                                        <Input
                                            placeholder="Thread ID..."
                                            size="xs"
                                            value={threadId}
                                            onChange={(e) => setThreadId(e.target.value)}
                                            onFocus={(event) => event.target.select()}
                                        />
                                    </FocusTrap>
                                ) : (
                                    <Text size="sm">
                                        {ticket.threadId ? (
                                            <Anchor href={threadLink} target="_blank" rel="noopener noreferrer">
                                                {ticket.threadId}
                                            </Anchor>
                                        ) : (
                                            <Text c="dimmed">#t-committee</Text>
                                        )}
                                    </Text>
                                )}
                                {isUpdatingThreadId ? (
                                    <Group gap="xs">
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color="success"
                                            onClick={handleUpdateThreadId}
                                            loading={updateThreadIdMutation.isPending}>
                                            <FontAwesomeIcon icon="floppy-disk" size="sm" />
                                        </ActionIcon>
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color="danger"
                                            onClick={() => setIsUpdatingThreadId(false)}>
                                            <FontAwesomeIcon icon="xmark" size="sm" />
                                        </ActionIcon>
                                    </Group>
                                ) : (
                                    <Group gap="xs">
                                        <Tooltip label="Update Thread ID">
                                            <ActionIcon
                                                size="sm"
                                                color="info"
                                                variant="subtle"
                                                onClick={() => setIsUpdatingThreadId(true)}>
                                                <FontAwesomeIcon icon="pen-to-square" size="sm" />
                                            </ActionIcon>
                                        </Tooltip>
                                        {ticket.threadId && (
                                            <CopyActionIcon value={threadLink} tooltip="Copy Thread Link" size="sm" />
                                        )}
                                    </Group>
                                )}
                            </Group>
                            {!ticket.threadId && (
                                <AlertText type="warning">
                                    Discord thread is not set! Make sure to set it to the thread where the {ticket.type}{" "}
                                    is being discussed.
                                </AlertText>
                            )}
                        </Stack>
                        <Group gap="xs">
                            <Button
                                onClick={handleToggleStatus}
                                loading={toggleStatusMutation.isPending}
                                color="warning"
                                variant={ticket.isActive ? "filled" : "outline"}
                                leftSection={<FontAwesomeIcon icon={ticket.isActive ? "lock" : "lock-open"} />}>
                                {ticket.isActive ? "Close" : "Reopen"}
                            </Button>
                            <Button
                                onClick={handleSnoozeTicket}
                                loading={snoozeTicketMutation.isPending}
                                color="warning"
                                variant="light"
                                disabled={ticket.isSnoozed}
                                leftSection={<FontAwesomeIcon icon="moon" />}>
                                {ticket.isSnoozed
                                    ? `Snoozed until ${dayjs(ticket.snoozedUntil).format("MMM Do, YYYY")}`
                                    : "Snooze Reminders"}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Stack>

            {isEditableReport && (
                <ReportEditModal ticket={ticket} opened={editModalOpened} onClose={() => setEditModalOpened(false)} />
            )}
        </Card>
    );
}
