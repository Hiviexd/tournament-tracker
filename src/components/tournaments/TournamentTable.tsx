import { Table, Group, Badge, Text, Tooltip, ScrollArea, Card, ActionIcon } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserLink from "../common/UserLink";
import GameModeIcon from "../common/GameModeIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import TournamentStatusBadge from "./TournamentStatusBadge";
import ReviewStatusBadge from "../common/badges/ReviewStatusBadge";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import _ from "lodash";
import config from "../../../config.json";
import utils from "../../../utils";

interface IProps {
    tournaments: ITournament[];
}

export default function TournamentTable({ tournaments }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    const getTournamentTypeInfo = (type: string) => {
        switch (type) {
            case "tournament":
                return { icon: "trophy", text: "Tournament", color: "orange" };
            case "contest":
                return { icon: "award", text: "Contest", color: "info" };
            default:
                return { icon: "question", text: "Unknown", color: "gray" };
        }
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
                            const typeInfo = getTournamentTypeInfo(tournament.type);
                            return (
                                <Table.Tr key={tournament._id}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Tooltip label={typeInfo.text}>
                                                <Badge color={typeInfo.color} variant="filled">
                                                    <FontAwesomeIcon icon={typeInfo.icon as IconProp} />
                                                </Badge>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>

                                    <Table.Td>
                                        <GameModeIcon mode={tournament.modes} />
                                    </Table.Td>

                                    <Table.Td>
                                        <Text fw={500} truncate>
                                            <Link to={`/tournaments/${tournament._id}`}>
                                                {_.truncate(tournament.name, { length: 45 })}
                                            </Link>
                                        </Text>
                                    </Table.Td>

                                    <Table.Td>
                                        <UserLink user={tournament.host} fw={500} />
                                    </Table.Td>

                                    <Table.Td>
                                        <Group gap="xs">
                                            <TournamentStatusBadge tournament={tournament} />
                                            <ReviewStatusBadge tournament={tournament} user={user} />
                                        </Group>
                                    </Table.Td>

                                    <Table.Td>
                                        <Badge color={tournament.isActive ? "success" : "danger"} variant="light">
                                            {tournament.isActive ? "Active" : "Archived"}
                                        </Badge>
                                    </Table.Td>

                                    {user?.isCommittee && (
                                        <Table.Td ta="center">
                                            {tournament.threadId ? (
                                                <Group gap={4} justify="center">
                                                    <Tooltip label="Copy Discord thread link">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            onClick={() =>
                                                                utils.copyToClipboard(
                                                                    `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${tournament.threadId}`
                                                                )
                                                            }>
                                                            <FontAwesomeIcon icon="copy" />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
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
        </Card>
    );
}
