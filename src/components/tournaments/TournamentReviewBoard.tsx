import { Table, Group, Text, ScrollArea, Card } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserLink from "../common/UserLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import config from "../../../config.json";
import DateBadge from "../common/badges/DateBadge";
import truncate from "lodash/truncate";
import CopyActionIcon from "../common/buttons/CopyActionIcon";

interface IProps {
    tournaments: ITournament[];
}

export default function TournamentReviewBoard({ tournaments }: IProps) {
    const getReviewerStatus = (tournament: ITournament, reviewerIndex: number) => {
        const reviewer = tournament.assignedReviewers?.[reviewerIndex];
        if (!reviewer) return null;

        const review = tournament.reviews.find((r) => r.author?.id === reviewer.id);
        if (!review) {
            return (
                <Group gap="xs">
                    <Text c="danger">
                        <FontAwesomeIcon icon="xmark-circle" />
                    </Text>
                    <UserLink user={reviewer} fw={500} />
                </Group>
            );
        }

        return (
            <Group gap="xs">
                <Text c="success">
                    <FontAwesomeIcon icon="check-circle" />
                </Text>
                <UserLink user={reviewer} fw={500} />
                {review.createdAt && <DateBadge date={review.createdAt} staticColor />}
            </Group>
        );
    };

    const getDiscordThreadLink = (tournament: ITournament) => {
        return `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${tournament.threadId}`;
    };

    // Sort tournaments by createdAt in descending order (newest first)
    const sortedTournaments = [...tournaments].sort(
        (a, b) =>
            new Date(b.startedReviewAt || b.createdAt).getTime() - new Date(a.startedReviewAt || a.createdAt).getTime()
    );

    return (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table miw={{ base: 1200, md: 800 }}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Tournament Name</Table.Th>
                            <Table.Th>Reviewer 1</Table.Th>
                            <Table.Th>Reviewer 2</Table.Th>
                            <Table.Th>Review Start Date</Table.Th>
                            <Table.Th ta="center">Thread</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sortedTournaments.map((tournament) => {
                            return (
                                <Table.Tr key={tournament.id}>
                                    <Table.Td>
                                        <Text fw={500} truncate>
                                            <Link to={`/tournaments/${tournament.id}`}>
                                                {truncate(tournament.name, { length: 45 })}
                                            </Link>
                                        </Text>
                                    </Table.Td>

                                    <Table.Td>{getReviewerStatus(tournament, 0) || "-"}</Table.Td>

                                    <Table.Td>{getReviewerStatus(tournament, 1) || "-"}</Table.Td>

                                    <Table.Td>
                                        {tournament.startedReviewAt ? (
                                            <DateBadge date={tournament.startedReviewAt} />
                                        ) : (
                                            "-"
                                        )}
                                    </Table.Td>

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
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}
