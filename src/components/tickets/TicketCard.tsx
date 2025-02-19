// Base
import { Card, Group, Stack, Text, Badge, Tooltip, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Types
import { ITicket } from "../../../interfaces/Ticket";

// Components
import UserDisplay from "../common/UserDisplay";
import UserLink from "../common/UserLink";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import DateBadge from "../common/badges/DateBadge";
import UserGroupBadge from "../common/badges/UserGroupBadge";

interface ITicketCardProps {
    ticket: ITicket;
}

export default function TicketCard({ ticket }: ITicketCardProps) {
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const getTargetInfo = () => {
        if (ticket.targetUser) {
            return {
                text: `User Report`,
                icon: "user",
                color: "red" as const,
            };
        }
        if (ticket.targetTournamentName) {
            return {
                text: `Tournament Report`,
                icon: "trophy",
                color: "orange" as const,
            };
        }
        return null;
    };

    const renderTarget = () => {
        if (ticket.type === "report") {
            if (ticket.targetUser) {
                return <UserDisplay user={ticket.targetUser} />;
            }
            if (ticket.targetTournamentName) {
                return (
                    <Text fw={700}>
                        Tournament:{" "}
                        <Anchor onClick={handleLinkClick} href={ticket.targetTournamentLink} target="_blank">
                            {ticket.targetTournamentName}
                        </Anchor>
                    </Text>
                );
            }
        }
        return null;
    };

    const targetInfo = getTargetInfo();
    const messageCount = ticket.messages.filter((message) => !message.isNote).length;

    return (
        <Card
            component={Link}
            to={`/tickets/${ticket._id}`}
            shadow="sm"
            padding="lg"
            radius="md"
            className="ticket-card"
            style={
                {
                    "--card-status-color": ticket.isActive
                        ? "var(--mantine-color-success-6)"
                        : "var(--mantine-color-danger-6)",
                } as React.CSSProperties
            }>
            <Stack gap="md" justify="space-between">
                <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                        <Text size="lg" fw={500}>
                            {ticket.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                            Created by <UserLink user={ticket.author} />
                        </Text>
                        {renderTarget()}
                    </Stack>
                </Group>

                <Group gap="xs" mt="auto">
                    <Tooltip label={ticket.type === "ticket" ? "Ticket" : "Report"}>
                        <Badge color={ticket.type === "ticket" ? "blue" : "red"} variant="filled">
                            <FontAwesomeIcon icon={ticket.type === "ticket" ? "paper-plane" : "flag"} />{" "}
                        </Badge>
                    </Tooltip>

                    <UserGroupBadge group={ticket.assignedGroup} tooltip="top" />

                    {targetInfo && (
                        <Tooltip label={targetInfo.text}>
                            <Badge color={targetInfo.color} variant="light">
                                <FontAwesomeIcon icon={targetInfo.icon as IconProp} />
                            </Badge>
                        </Tooltip>
                    )}

                    <Badge variant="light">
                        <Tooltip label={`${messageCount} ${messageCount === 1 ? "message" : "messages"}`}>
                            <span>
                                <FontAwesomeIcon icon="comments" /> {messageCount}
                            </span>
                        </Tooltip>
                    </Badge>

                    <DateBadge date={ticket.updatedAt} warningAge={7} dangerAge={10} staticColor={!ticket.isActive} />
                </Group>
            </Stack>
        </Card>
    );
}
