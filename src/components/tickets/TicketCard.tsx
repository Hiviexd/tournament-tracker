// Base
import { Card, Group, Stack, Text, Badge, Tooltip, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

// Types
import { ITicket } from "../../../interfaces/Ticket";

// Components
import UserDisplay from "../common/UserDisplay";
import UserLink from "../common/UserLink";
import DateBadge from "../common/badges/DateBadge";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import ReportTypeBadge from "../common/badges/ReportTypeBadge";
import { TruncatedText } from "../common/TruncatedText";

interface ITicketCardProps {
    ticket: ITicket;
}

export default function TicketCard({ ticket }: ITicketCardProps) {
    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const getStatusColor = (): string => {
        if (!ticket.isActive) return "danger";

        const updatedDays = moment().diff(moment(ticket.lastResponseAt), "days");
        if (updatedDays >= 10) return "danger";
        if (updatedDays >= 7) return "warning";
        return "success";
    };

    const messageCount = ticket.messages.filter((message) => !message.isNote).length;

    return (
        <Card
            component={Link}
            to={`/${ticket.type === "ticket" ? "tickets" : "reports"}/${ticket._id}`}
            shadow="sm"
            padding="lg"
            radius="md"
            className="ticket-card"
            data-active={ticket.isActive}
            style={
                ticket.isActive
                    ? {
                        ["--card-status-color" as any]: `var(--mantine-color-${getStatusColor()}-6)`,
                    }
                    : undefined
            }>
            <Stack gap="md" justify="space-between" h="100%">
                <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                        <TruncatedText lineClamp={2} textProps={{ size: "lg", fw: 500 }}>
                            {ticket.title}
                        </TruncatedText>
                        <Text size="sm" c="dimmed">
                            Created by <UserLink user={ticket.author} />
                        </Text>
                        {renderTarget()}
                    </Stack>
                </Group>

                {/* badges */}

                <Group gap="xs" mt="auto">
                    <ReportTypeBadge report={ticket} />

                    <UserGroupBadge group={ticket.assignedGroup} tooltip="top" variant="light" />

                    {ticket.isSnoozed && (
                        <Tooltip
                            label={`Reminders snoozed until ${moment(ticket.snoozedUntil).format("MMM Do, YYYY")}`}>
                            <Badge color="grape" variant="light">
                                <FontAwesomeIcon icon="moon" />
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

                    <DateBadge
                        date={ticket.lastResponseAt}
                        warningAge={7}
                        dangerAge={10}
                        staticColor={!ticket.isActive}
                    />
                </Group>
            </Stack>
        </Card>
    );
}
