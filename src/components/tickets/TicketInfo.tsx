import { Card, Group, Stack, Text, Badge, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITicket } from "../../../interfaces/Ticket";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import DateBadge from "../common/badges/DateBadge";

interface IProps {
    ticket: ITicket;
}

export default function TicketInfo({ ticket }: IProps) {
    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={4}>
                        <Text size="xl" fw={700}>
                            {ticket.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                            Created by <UserLink user={ticket.author} /> • <DateBadge date={ticket.createdAt} />
                        </Text>
                    </Stack>
                    <Group>
                        <Tooltip label={ticket.type === "ticket" ? "Ticket" : "Report"}>
                            <Badge color={ticket.type === "ticket" ? "blue" : "red"} variant="filled">
                                <FontAwesomeIcon icon={ticket.type === "ticket" ? "paper-plane" : "flag"} />
                            </Badge>
                        </Tooltip>
                        <UserGroupBadge group={ticket.assignedGroup} />
                        <Badge color={ticket.isActive ? "green" : "red"}>{ticket.isActive ? "Active" : "Closed"}</Badge>
                    </Group>
                </Group>
                {ticket.targetUser && (
                    <Group>
                        <Text fw={500}>Reported User:</Text>
                        <UserLink user={ticket.targetUser} />
                    </Group>
                )}
                {ticket.targetTournamentName && (
                    <Group>
                        <Text fw={500}>Reported Tournament:</Text>
                        <Text component="a" href={ticket.targetTournamentLink} target="_blank">
                            {ticket.targetTournamentName}
                        </Text>
                    </Group>
                )}
            </Stack>
        </Card>
    );
}
