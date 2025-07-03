import { Card, Title, Group, Stack, Badge, Text, Loader } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import GameModeIcon from "../common/GameModeIcon";
import DateBadge from "../common/badges/DateBadge";
import UserLink from "../common/UserLink";
import TournamentTypeBadge from "../common/badges/TournamentTypeBadge";
import { useImageLoad } from "../../hooks/useImageLoad";

interface IProps {
    tournament: ITournament;
}

export default function TournamentPageHeader({ tournament }: IProps) {
    const { loading, error } = useImageLoad(tournament.bannerUrl);

    // Use fallback image if there's an error or no banner URL
    const bannerImageUrl = error || !tournament.bannerUrl ? "/assets/default-banner.jpg" : tournament.bannerUrl;

    return (
        <Card shadow="sm" p="0" radius="md">
            <div style={{ position: "relative" }}>
                <div
                    className="tournament-banner"
                    style={{
                        backgroundImage: `url(${bannerImageUrl})`,
                        height: "200px",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: "var(--mantine-radius-md) var(--mantine-radius-md) 0 0",
                        opacity: loading ? 0 : 1,
                    }}
                />

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
                        <Loader size="md" color="primary" />
                    </div>
                )}
            </div>
            <Stack gap="md" p="lg">
                <Group justify="space-between" align="center">
                    <Stack gap={5}>
                        <Title order={2}>{tournament.name}</Title>
                    </Stack>
                    <Badge color={tournament.isActive ? "success" : "gray"} variant="light">
                        {tournament.isActive ? "Active" : "Archived"}
                    </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                    Hosted by <UserLink user={tournament.host} />
                </Text>

                <Group gap="xs" justify="space-between">
                    <Group gap={5}>
                        <TournamentTypeBadge type={tournament.type} withText />
                        <GameModeIcon mode={tournament.modes} />
                    </Group>

                    <Text size="sm" c="dimmed">
                        Created <DateBadge date={tournament.createdAt} staticColor />
                    </Text>
                </Group>
            </Stack>
        </Card>
    );
}
