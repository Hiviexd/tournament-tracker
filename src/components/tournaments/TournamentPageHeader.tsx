import { Card, Title, Group, Stack, Badge, Text } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import GameModeIcon from "../common/GameModeIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import DateBadge from "../common/badges/DateBadge";
import UserLink from "../common/UserLink";

interface IProps {
    tournament: ITournament;
}

export default function TournamentPageHeader({ tournament }: IProps) {
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
        <Card shadow="sm" p="0" radius="md">
            <div
                className="tournament-banner"
                style={{
                    backgroundImage: `url(${tournament.bannerUrl})`,
                    height: "200px",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "var(--mantine-radius-md) var(--mantine-radius-md) 0 0",
                }}
            />
            <Stack gap="md" p="lg">
                <Group justify="space-between" align="center">
                    <Stack gap={5}>
                        <Title order={2} style={{ lineHeight: 0 }}>
                            {tournament.name}
                        </Title>
                    </Stack>
                    <Badge color={tournament.isActive ? "success" : "danger"} variant="light">
                        {tournament.isActive ? "Active" : "Concluded"}
                    </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                    Hosted by <UserLink user={tournament.host} />
                </Text>

                <Group gap="xs" justify="space-between">
                    <Group gap={5}>
                        <Badge color={getTournamentTypeInfo().color} variant="filled">
                            <Group gap={5}>
                                <FontAwesomeIcon icon={getTournamentTypeInfo().icon as IconProp} />
                                <span>{getTournamentTypeInfo().text}</span>
                            </Group>
                        </Badge>
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
