import { Card, Group, Stack, Title, Badge, Tooltip } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserDisplay from "../common/UserDisplay";
import GameModeIcon from "../common/GameModeIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import TournamentStatusBadge from "./TournamentStatusBadge";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import VoteCountBadge from "../common/badges/VoteCountBadge";

interface IProps {
    tournament: ITournament;
}

export default function TournamentCard({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
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

    return (
        <Card
            shadow="sm"
            p="lg"
            radius="md"
            className="tournament-card"
            component={Link}
            to={`/tournaments/${tournament._id}`}
            data-active={tournament.isActive}
            style={
                {
                    "--card-status-color": tournament.isActive
                        ? "var(--mantine-color-success-6)"
                        : "var(--mantine-color-danger-6)",
                    "--banner-url": `url(${tournament.bannerUrl})`,
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
                        {tournament.isActive ? "Active" : "Archived"}
                    </Badge>
                </Group>

                <Group gap="xs">
                    <Tooltip label={getTournamentTypeInfo().text}>
                        <Badge color={getTournamentTypeInfo().color} variant="filled">
                            <FontAwesomeIcon icon={getTournamentTypeInfo().icon as IconProp} />
                        </Badge>
                    </Tooltip>
                    <GameModeIcon mode={tournament.modes} />
                    <TournamentStatusBadge tournament={tournament} />
                    {user?.isCommittee && ["reviewOngoing", "changesRequested"].includes(tournament.status) && (
                        <VoteCountBadge
                            voteCount={tournament.reviews.length}
                            totalVotes={2}
                            textOverride="reviews"
                            variant="light"
                        />
                    )}
                </Group>
            </Stack>
        </Card>
    );
}
