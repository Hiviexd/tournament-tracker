import { Card, Group, Stack, Title, Badge } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "../../../interfaces/Tournament";
import UserDisplay from "../common/UserDisplay";
import GameModeIcon from "../common/GameModeIcon";
import TournamentStatusBadge from "../common/badges/TournamentStatusBadge";
import ReviewStatusBadge from "../common/badges/ReviewStatusBadge";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import VoteCountBadge from "../common/badges/VoteCountBadge";
import TournamentTypeBadge from "../common/badges/TournamentTypeBadge";

interface IProps {
    tournament: ITournament;
}

export default function TournamentCard({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

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
                    <TournamentTypeBadge type={tournament.type} />
                    <GameModeIcon mode={tournament.modes} />
                    <TournamentStatusBadge status={tournament.status} />
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
