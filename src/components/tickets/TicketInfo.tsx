import { Card, Group, Stack, Text, Badge, Tooltip, Title, Anchor, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicket } from "../../../interfaces/Ticket";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import DateBadge from "../common/badges/DateBadge";
import UserCard from "../common/UserCard";
import { IUser } from "../../../interfaces/User";
import { useToggleStatus } from "../../hooks/useTickets";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

interface IProps {
    ticket: ITicket;
}

export default function TicketInfo({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const toggleStatusMutation = useToggleStatus(ticket._id);

    const handleToggleStatus = async () => {
        if (!window.confirm(`Are you sure you want to ${ticket.isActive ? "close" : "reopen"} this ticket?`)) return;
        await toggleStatusMutation.mutateAsync();
    };

    const handleUserCardClick = (targetUser: IUser) => {
        window.open(`https://osu.ppy.sh/users/${targetUser.osuId}`, "_blank");
    };
    return (
        <Card
            shadow="sm"
            p="lg"
            radius="md"
            className="ticket-info"
            style={
                {
                    "--card-status-color": ticket.isActive
                        ? "var(--mantine-color-success-6)"
                        : "var(--mantine-color-danger-6)",
                } as React.CSSProperties
            }>
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={4}>
                        <Text size="xl" fw={700}>
                            {ticket.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                            Created by <UserLink user={ticket.author} /> • Last updated{" "}
                            <DateBadge date={ticket.updatedAt} />
                        </Text>
                    </Stack>
                    <Group gap="xs">
                        <Tooltip label={ticket.type === "ticket" ? "Ticket" : "Report"}>
                            <Badge color={ticket.type === "ticket" ? "info" : "red"} variant="filled">
                                <FontAwesomeIcon icon={ticket.type === "ticket" ? "paper-plane" : "flag"} />
                            </Badge>
                        </Tooltip>
                        <UserGroupBadge group={ticket.assignedGroup} tooltip="top" />
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
                    <Group>
                        <Button
                            onClick={handleToggleStatus}
                            loading={toggleStatusMutation.isPending}
                            color={ticket.isActive ? "danger" : "warning"}
                            leftSection={<FontAwesomeIcon icon={ticket.isActive ? "lock" : "lock-open"} />}>
                            {ticket.isActive ? "Close Ticket" : "Reopen Ticket"}
                        </Button>
                    </Group>
                )}
            </Stack>
        </Card>
    );
}
