import { Card, Group, Stack, Title, Badge, Tooltip } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserDisplay from "../common/UserDisplay";
import GameModeIcon from "../common/GameModeIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IProps {
    tournament: ITournament;
}

export default function TournamentCard({ tournament }: IProps) {
    const getTournamentTypeInfo = () => {
        switch (tournament.type) {
            case "tournament":
                return { icon: "trophy", text: "Tournament", color: "orange" };
            case "contest":
                return { icon: "award", text: "Contest", color: "info" };
            default:
                return { icon: "question", text: "Unknown", color: "gray" };
        }
    };

    const getTournamentStatusColor = () => {
        switch (tournament.status) {
            case "supportRequestReceived":
                return "violet";
            case "screeningOngoing":
                return "indigo";
            case "screeningConcluded":
                return "info";
            case "reviewOngoing":
                return "yellow";
            case "changesRequested":
                return "orange";
            case "badgeApproved":
                return "success";
            case "badgeRejected":
                return "danger";
            case "noBadgeRequested":
                return "gray";
            default:
                return "gray";
        }
    };

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
                    "--banner-url": `url(${tournament.banner?.url || "https://nats.are-la.me/29HdcgA.png"})`,
                } as React.CSSProperties
            }>
            <div className="tournament-card-banner" />
            <Stack gap="md" className="tournament-card-content">
                <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                        <Title order={4}>{tournament.name}</Title>
                        <Group>
                            <UserDisplay user={tournament.host} />
                        </Group>
                    </Stack>
                    <Badge color={tournament.isActive ? "success" : "danger"} variant="light">
                        {tournament.isActive ? "Active" : "Concluded"}
                    </Badge>
                </Group>

                <Group gap="xs">
                    <Tooltip label={getTournamentTypeInfo().text}>
                        <Badge color={getTournamentTypeInfo().color} variant="filled">
                            <FontAwesomeIcon icon={getTournamentTypeInfo().icon as IconProp} />
                        </Badge>
                    </Tooltip>
                    <GameModeIcon mode={tournament.modes} />
                    <Badge color={getTournamentStatusColor()} variant="light">
                        {tournament.statusString}
                    </Badge>
                </Group>
            </Stack>
        </Card>
    );
}
