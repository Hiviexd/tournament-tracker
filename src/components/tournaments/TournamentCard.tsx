import { Card, Group, Stack, Title, Text, Badge, Tooltip } from "@mantine/core";
import { Link } from "react-router-dom";
import moment from "moment";
import { ITournament } from "../../../interfaces/Tournament";
import UserDisplay from "../common/UserDisplay";
import GameModeIcon from "../common/GameModeIcon";

interface IProps {
    tournament: ITournament;
}

export default function TournamentCard({ tournament }: IProps) {
    return (
        <Card
            shadow="sm"
            p="lg"
            className="tournament-card"
            component={Link}
            to={`/tournaments/${tournament._id}`}
            style={
                {
                    "--card-status-color": tournament.isActive
                        ? "var(--mantine-color-success-6)"
                        : "var(--mantine-color-danger-6)",
                } as React.CSSProperties
            }>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: tournament.bannerUrl
                        ? `url(${tournament.bannerUrl})`
                        : "url(https://nats.are-la.me/29HdcgA.png)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.4)",
                    zIndex: 0,
                }}
            />
            <Stack gap="md" style={{ position: "relative", zIndex: 1 }}>
                <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                        <Title order={4}>{tournament.name}</Title>
                        <Group>
                            <UserDisplay user={tournament.host} />
                            <Text size="sm" c="dimmed">
                                •{" "}
                                <Tooltip label={moment(tournament.createdAt).format("LLL")}>
                                    <span>{moment(tournament.createdAt).fromNow()}</span>
                                </Tooltip>
                            </Text>
                        </Group>
                    </Stack>
                    <Badge color={tournament.isActive ? "success" : "danger"} variant="light">
                        {tournament.isActive ? "Active" : "Inactive"}
                    </Badge>
                </Group>

                <Group>
                    <Badge color="primary" variant="light">
                        {tournament.type}
                    </Badge>
                    <Tooltip label={tournament.modes.join(", ")}>
                        <Badge variant="light">
                            <GameModeIcon mode={tournament.modes} />
                        </Badge>
                    </Tooltip>
                    <Badge color="warning" variant="light">
                        {tournament.status}
                    </Badge>
                </Group>
            </Stack>
        </Card>
    );
}
