import { Card, Group, Stack, Title, Badge, Tooltip } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserDisplay from "../common/UserDisplay";
import GameModeIcon from "../common/GameModeIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import TournamentStatusBadge from "./TournamentStatusBadge";
import ReviewStatusBadge from "../common/badges/ReviewStatusBadge";
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
                    "--banner-url": `url(${tournament.bannerUrl || "/assets/default-banner.jpg"})`,
                } as React.CSSProperties
            }>
            <div className="tournament-card-banner" />
            <Stack gap="md" className="tournament-card-content" justify="space-between" h="100%">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Title order={4} style={{ wordBreak: "break-word", flex: 1 }}>
                        {tournament.name}
                    </Title>
                    <Badge color={tournament.isActive ? "success" : "gray"} variant="light" style={{ flexShrink: 0 }}>
                        {tournament.isActive ? "Active" : "Archived"}
                    </Badge>
                </Group>

                <UserDisplay user={tournament.host} />

                {/* badges */}
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
                            totalVotes={tournament.assignedReviewers?.length || 2}
                            textOverride="reviews"
                            variant="light"
                        />
                    )}
                    <ReviewStatusBadge tournament={tournament} user={user} />
                </Group>
            </Stack>
        </Card>
    );
}
