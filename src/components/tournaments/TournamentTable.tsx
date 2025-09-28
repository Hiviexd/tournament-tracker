import { Table, Group, Badge, Text, ScrollArea, Card, Tooltip } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserLink from "../common/UserLink";
import GameModeIcon from "../common/GameModeIcon";
import TournamentStatusBadge from "../common/badges/TournamentStatusBadge";
import ReviewStatusBadge from "../common/badges/ReviewStatusBadge";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import config from "../../../config.json";
import TournamentTypeBadge from "../common/badges/TournamentTypeBadge";
import CopyActionIcon from "../common/buttons/CopyActionIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TruncatedText } from "../common/TruncatedText";
import utils from "../../../utils";

interface IProps {
    tournaments: ITournament[];
    total?: number;
    currentPage?: number;
}

export default function TournamentTable({ tournaments, total, currentPage }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    const getDiscordThreadLink = (tournament: ITournament) => {
        return `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${tournament.threadId}`;
    };

    const potentiallyNeedsReview = (tournament: ITournament) => {
        const validStatuses = ["supportRequestReceived", "screeningConcluded"];
        if (!validStatuses.includes(tournament.status) || !tournament.endDate) return false;
        return new Date(tournament.endDate) < new Date();
    };

    const needsReviewAssignment = (tournament: ITournament) => {
        return tournament.status === "reviewOngoing" && !tournament.assignedReviewers?.length;
    };

    return (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table miw={{ base: 1200, md: 800 }}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Mode</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Host</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>State</Table.Th>
                            {user?.isCommittee && <Table.Th ta="center">Thread</Table.Th>}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {tournaments.map((tournament) => {
                            return (
                                <Table.Tr key={tournament.id}>
                                    <Table.Td>
                                        <TournamentTypeBadge type={tournament.type} />
                                    </Table.Td>

                                    <Table.Td>
                                        <GameModeIcon mode={tournament.modes} />
                                    </Table.Td>

                                    <Table.Td w={350}>
                                        <Link to={`/tournaments/${tournament._id}`}>
                                            <TruncatedText lineClamp={1} textProps={{ fw: 500 }}>
                                                {tournament.name}
                                            </TruncatedText>
                                        </Link>
                                    </Table.Td>

                                    <Table.Td>
                                        {tournament.hosts.length === 1 ? (
                                            <UserLink user={tournament.hosts[0]} fw={500} displayActiveInfringement />
                                        ) : (
                                            <Group gap={4} align="center">
                                                <UserLink
                                                    user={tournament.hosts[0]}
                                                    fw={500}
                                                    displayActiveInfringement
                                                />
                                                <Tooltip label={utils.formatHostsList(tournament.hosts)}>
                                                    <Text size="xs" c="dimmed" style={{ lineHeight: "normal" }}>
                                                        +{tournament.hosts.length - 1}
                                                    </Text>
                                                </Tooltip>
                                            </Group>
                                        )}
                                    </Table.Td>

                                    <Table.Td>
                                        <Group gap="xs">
                                            <TournamentStatusBadge status={tournament.status} />
                                            {user?.isCommittee && potentiallyNeedsReview(tournament) && (
                                                <Tooltip
                                                    multiline
                                                    w={220}
                                                    ta="center"
                                                    label="Tournament ended, potentially movable to review phase">
                                                    <Badge color="yellow" variant="light">
                                                        <FontAwesomeIcon icon="exclamation-triangle" />
                                                    </Badge>
                                                </Tooltip>
                                            )}
                                            {user?.isCommittee && needsReviewAssignment(tournament) && (
                                                <Tooltip label="Needs review assignment">
                                                    <Badge color="red" variant="light" className="animation-pulse">
                                                        <FontAwesomeIcon icon="exclamation-triangle" />
                                                    </Badge>
                                                </Tooltip>
                                            )}
                                            <ReviewStatusBadge tournament={tournament} user={user} />
                                        </Group>
                                    </Table.Td>

                                    <Table.Td>
                                        <Badge color={tournament.isActive ? "success" : "gray"} variant="light">
                                            {tournament.isActive ? "Active" : "Archived"}
                                        </Badge>
                                    </Table.Td>

                                    {user?.isCommittee && (
                                        <Table.Td ta="center">
                                            {tournament.threadId ? (
                                                <CopyActionIcon
                                                    value={getDiscordThreadLink(tournament)}
                                                    tooltip="Copy Discord thread link"
                                                    size="sm"
                                                    color="primary"
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </Table.Td>
                                    )}
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
            {total !== undefined && (
                <Group justify="space-between" align="center" mt="md" ml="auto">
                    <Text size="sm" c="dimmed">
                        Showing {tournaments.length} out of {total} tournaments
                        {currentPage && currentPage > 1 && ` (page ${currentPage})`}
                    </Text>
                </Group>
            )}
        </Card>
    );
}
