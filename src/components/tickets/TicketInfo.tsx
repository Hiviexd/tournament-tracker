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
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicket } from "../../../interfaces/Ticket";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import DateBadge from "../common/badges/DateBadge";
import UserCard from "../common/UserCard";
import { IUser } from "../../../interfaces/User";
import { useSnoozeTicket, useToggleStatus, useUpdateThreadId } from "../../hooks/useTickets";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import moment from "moment";
import { useState } from "react";
import config from "../../../config.json";

interface IProps {
    ticket: ITicket;
}

export default function TicketInfo({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [threadId, setThreadId] = useState(ticket.threadId);
    const [isUpdatingThreadId, setIsUpdatingThreadId] = useState(false);

    const toggleStatusMutation = useToggleStatus(ticket._id);
    const updateThreadIdMutation = useUpdateThreadId(ticket._id);
    const snoozeTicketMutation = useSnoozeTicket(ticket._id);

    const getStatusColor = (): string => {
        if (!ticket.isActive) return "danger";

        const updatedDays = moment().diff(moment(ticket.lastResponseAt), "days");
        if (updatedDays >= 10) return "danger";
        if (updatedDays >= 7) return "warning";
        return "success";
    };

    const handleToggleStatus = async () => {
        if (!window.confirm(`Are you sure you want to ${ticket.isActive ? "close" : "reopen"} this ${ticket.type}?`))
            return;
        await toggleStatusMutation.mutateAsync();
    };

    const handleSnoozeTicket = async () => {
        if (
            !window.confirm(
                "Are you sure you want to snooze reminders for this ticket for 7 days?\n\nIt will be unsnoozed after that time period, or when a new message is sent."
            )
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
                    <Stack gap="xs" w="25%">
                        <Title order={5}>Reported User</Title>
                        <UserCard static user={ticket.targetUser} onSelect={handleUserCardClick} />
                    </Stack>
                )}
                {ticket.targetTournamentName && (
                    <Text fw={700}>
                        Reported Tournament:{" "}
                        <Anchor href={ticket.targetTournamentLink} target="_blank">
                            {ticket.targetTournamentName}
                        </Anchor>
                    </Text>
                )}
                {user?.isCommittee && (
                    <Stack gap="xs">
                        <Divider my="xs" />
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
                                        <Anchor
                                            href={`https://discord.com/channels/${config.discord.webhooks.main.serverId}/${ticket.threadId}`}
                                            target="_blank">
                                            {ticket.threadId}
                                        </Anchor>
                                    ) : (
                                        <Text c="dimmed">#t-committee</Text>
                                    )}
                                </Text>
                            )}
                            {isUpdatingThreadId ? (
                                <Group gap={4}>
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
                                <ActionIcon
                                    size="sm"
                                    color="info"
                                    variant="subtle"
                                    onClick={() => setIsUpdatingThreadId(true)}>
                                    <FontAwesomeIcon icon="pen-to-square" size="sm" />
                                </ActionIcon>
                            )}
                        </Group>
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
                                    ? `Snoozed until ${moment(ticket.snoozedUntil).format("MMM Do, YYYY")}`
                                    : "Snooze Reminders"}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Stack>
        </Card>
    );
}
