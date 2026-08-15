import { Card, Group, Stack, Title, Badge, Loader } from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament } from "@tc/types/Tournament";
import UserDisplay from "../common/UserDisplay";
import GameModeIcon from "../common/GameModeIcon";
import TournamentStatusBadge from "../common/badges/TournamentStatusBadge";
import ReviewStatusBadge from "../common/badges/ReviewStatusBadge";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import VoteCountBadge from "../common/badges/VoteCountBadge";
import TournamentTypeBadge from "../common/badges/TournamentTypeBadge";
import { useImageLoad } from "../../hooks/useImageLoad";
import { cssVars } from "../../themes/cssVars";

interface IProps {
    tournament: ITournament;
}

export default function TournamentCard({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const { loading, error } = useImageLoad(tournament.bannerUrl);

    // Use fallback image if there's an error or no banner URL
    const bannerImageUrl = error || !tournament.bannerUrl ? "/assets/default-banner.jpg" : tournament.bannerUrl;

    return (
        <Card
            shadow="sm"
            p="lg"
            radius="md"
            className="tournament-card"
            component={Link}
            to={`/tournaments/${tournament._id}`}
            data-active={tournament.isActive}
            style={cssVars({
                "--card-status-color": tournament.isActive
                    ? "var(--mantine-color-success-6)"
                    : "var(--mantine-color-danger-6)",
                "--banner-url": `url(${bannerImageUrl})`,
                "--banner-opacity": loading ? 0 : 1,
            })}>
            <div className="tournament-card-banner" />

            {/* Loading spinner */}
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                    }}>
                    <Loader size="sm" color="primary" />
                </div>
            )}
            <Stack gap="md" className="tournament-card-content" justify="space-between" h="100%">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Title order={4} style={{ wordBreak: "break-word", flex: 1 }}>
                        {tournament.name}
                    </Title>
                    <Badge color={tournament.isActive ? "success" : "gray"} variant="light" style={{ flexShrink: 0 }}>
                        {tournament.isActive ? "Active" : "Archived"}
                    </Badge>
                </Group>

                {tournament.hosts.length === 1 ? (
                    <UserDisplay user={tournament.hosts[0]} />
                ) : (
                    <Group gap="xl" align="center">
                        {tournament.hosts.map((host) => (
                            <UserDisplay key={host.id} user={host} />
                        ))}
                    </Group>
                )}

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
