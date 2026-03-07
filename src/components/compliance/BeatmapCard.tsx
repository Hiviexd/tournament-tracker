import { Card, Group, Stack, Text, Tooltip, Anchor } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Link } from "react-router-dom";
import { IValidationResult } from "../../../interfaces/ComplianceApi";
import MarkdownText from "../common/MarkdownText";
import AlertText from "../common/AlertText";

interface BeatmapCardProps {
    beatmap: IValidationResult;
    notes?: string | null;
}

export default function BeatmapCard({ beatmap }: BeatmapCardProps) {
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

    const statusInfo = getStatusIcon(beatmap.status);

    return (
        <Card
            radius="md"
            p="md"
            className="beatmap-card"
            component={Link}
            to={`https://osu.ppy.sh/beatmapsets/${beatmap.beatmapsetId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={
                {
                    "--banner-url": `url(${beatmap.cover})`,
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
                        {beatmap.artist} - {beatmap.title}
                    </Text>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={1}>
                    mapped by{" "}
                    <Anchor fw={700} href={`https://osu.ppy.sh/users/${beatmap.ownerId}`} target="_blank" rel="noopener noreferrer">
                        {beatmap.ownerUsername}
                    </Anchor>
                </Text>

                {beatmap.notes && (
                    <AlertText type="warning" size="sm">
                        <MarkdownText content={beatmap.notes} size="sm" />
                    </AlertText>
                )}

                {/*["graveyard", "pending", "wip"].includes(beatmap.status) && (
                    <Text size="sm" c="orange" lineClamp={2}>
                        <FontAwesomeIcon icon="triangle-exclamation" /> Graveyard/Pending beatmaps don't always have
                        correct metadata.
                    </Text>
                )*/}
            </Stack>
        </Card>
    );
}
