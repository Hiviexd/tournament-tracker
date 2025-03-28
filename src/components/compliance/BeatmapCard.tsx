import { Card, Group, Stack, Text, Tooltip, Anchor } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { IBeatmap } from "../../../interfaces/OsuApi";
import { Link } from "react-router-dom";

interface BeatmapCardProps {
    beatmap: IBeatmap;
    notes?: string | null;
}

export default function BeatmapCard({ beatmap, notes = null }: BeatmapCardProps) {
    const getStatusIcon = (status: string): { icon: IconProp; color: string; label: string } => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case "ranked":
                return { icon: "check-double", color: "info", label: "Ranked" };
            case "loved":
                return { icon: "heart", color: "pink", label: "Loved" };
            case "graveyard":
                return { icon: "question-circle", color: "gray", label: "Graveyard" };
            case "wip":
            case "pending":
                return { icon: "question-circle", color: "warning", label: "WIP/Pending" };
            case "approved":
                return { icon: "check-circle", color: "success", label: "Approved" };
            case "qualified":
                return { icon: "check", color: "success", label: "Qualified" };
            default:
                return { icon: "question", color: "gray", label: "Unknown" };
        }
    };

    const statusInfo = getStatusIcon(beatmap.beatmapset.status);

    return (
        <Card
            radius="md"
            p="md"
            className="beatmap-card"
            component={Link}
            to={`${beatmap.url}#${beatmap.mode}/${beatmap.id}`}
            target="_blank"
            style={
                {
                    "--banner-url": `url(${beatmap.beatmapset.covers["card@2x"]})`,
                } as React.CSSProperties
            }>
            <div className="beatmap-card-banner" />
            <Stack gap="xs" className="beatmap-card-content">
                <Group gap="xs" align="center">
                    <Tooltip label={statusInfo.label}>
                        <Text c={statusInfo.color} size="lg">
                            <FontAwesomeIcon icon={statusInfo.icon} />
                        </Text>
                    </Tooltip>
                    <Text size="lg" fw={600} lineClamp={2} style={{ flex: 1 }}>
                        {beatmap.beatmapset.artist} - {beatmap.beatmapset.title}
                    </Text>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={1}>
                    mapped by{" "}
                    <Anchor fw={700} href={`https://osu.ppy.sh/users/${beatmap.beatmapset.user_id}`} target="_blank">
                        {beatmap.beatmapset.creator}
                    </Anchor>
                </Text>

                {notes && (
                    <Text size="sm" c="yellow" lineClamp={2}>
                        <FontAwesomeIcon icon="circle-info" /> {notes}
                    </Text>
                )}

                {["graveyard", "pending", "wip"].includes(beatmap.beatmapset.status) && (
                    <Text size="sm" c="orange" lineClamp={2}>
                        <FontAwesomeIcon icon="triangle-exclamation" /> Graveyard/Pending beatmaps don't always have
                        correct metadata.
                    </Text>
                )}
            </Stack>
        </Card>
    );
}
