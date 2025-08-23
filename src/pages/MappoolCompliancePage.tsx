import { useState } from "react";
import {
    Stack,
    Card,
    Button,
    SimpleGrid,
    Group,
    Text,
    Skeleton,
    Divider,
    Textarea,
    Popover,
    Mark,
    Highlight,
    Alert,
    Title,
    type MantineRadius
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMappoolCompliance } from "../hooks/useBeatmaps";
import { IBeatmap } from "../../interfaces/OsuApi";
import BeatmapCard from "../components/compliance/BeatmapCard";
import ResultSection from "../components/compliance/ResultSection";
import MarkdownText from "../components/common/MarkdownText";
import utils from "../../utils";

interface IBeatmapWithNotes extends IBeatmap {
    notes: string | null;
}

interface ComplianceData {
    message: string;
    allowed: IBeatmap[];
    partial: IBeatmapWithNotes[];
    disallowed: IBeatmap[];
    errors: string[];
}

interface IProps {
    header?: string;
    radius?: MantineRadius;
}

export default function MappoolCompliancePage({ header, radius = "sm" }: IProps) {
    const [input, setInput] = useState("");
    const [opened, { close, open }] = useDisclosure(false);
    const { mutate: checkCompliance, isPending, data } = useMappoolCompliance(input);

    const infoText = `This tool helps with ensuring your mappool is in compliance with official [tournament support rules](https://osu.ppy.sh/wiki/en/Tournaments/Official_support) regarding which beatmaps may be used in officially-supported osu! tournaments by checking beatmaps against the [osu! content usage permissions](https://osu.ppy.sh/wiki/en/Rules/Content_usage_permissions#artist-permissions).

Check out the Discord bot version of this tool here: [**OMCC**](https://github.com/hburn7/mappool-compliance-checker) (created by [Stage](https://osu.ppy.sh/users/8191845))
    `;

    const handleSubmit = () => {
        if (!input.trim()) return;
        checkCompliance();
    };

    const statusAlert = (complianceData: ComplianceData) => {
        if (complianceData.disallowed.length === 0 && complianceData.partial.length === 0) {
            return (
                <Alert
                    color="success"
                    icon={<FontAwesomeIcon icon="check-circle" />}
                    title="No disallowed beatmaps found! 🥳"
                />
            );
        }

        return (
            <Stack gap="sm">
                {complianceData.disallowed.length > 0 && (
                    <Alert
                        color="danger"
                        icon={<FontAwesomeIcon icon="times-circle" />}
                        title={`Found ${utils.formatCount(complianceData.disallowed.length, "disallowed beatmap")}!`}
                    />
                )}
                {complianceData.partial.length > 0 && (
                    <Alert
                        color="warning"
                        icon={<FontAwesomeIcon icon="exclamation-circle" />}
                        title={`Found ${utils.formatCount(
                            complianceData.partial.length,
                            "potentially disallowed beatmap"
                        )}!`}
                    />
                )}
            </Stack>
        );
    };

    const LoadingState = () => (
        <Stack gap="md">
            {[1, 2, 3].map((i) => (
                <Card key={i} shadow="sm" p="lg">
                    <Stack gap="md">
                        <Group>
                            <Skeleton height={24} circle />
                            <Skeleton height={24} width="15%" />
                            <Skeleton height={20} width={30} radius="xl" />
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                            {[1, 2, 3].map((j) => (
                                <Card key={j} shadow="sm" p="md" bg="primary.10">
                                    <Stack gap="xs">
                                        <Skeleton height={20} width="80%" />
                                        <Skeleton height={16} width="60%" />
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>
                </Card>
            ))}
        </Stack>
    );

    const complianceData = data as ComplianceData | undefined;

    return (
        <Stack gap="lg">
            <Card shadow="sm" p="lg" radius={radius}>
                <Stack gap="md">
                    {header && <Title order={3}>{header}</Title>}
                    <MarkdownText content={infoText} />
                    <Text>
                        To use this tool, enter a list of{" "}
                        <Popover middlewares={{ flip: true, shift: true, inline: true }} position="top" opened={opened}>
                            <Popover.Target>
                                <Mark color="primary" onMouseEnter={open} onMouseLeave={close}>
                                    beatmap
                                </Mark>
                            </Popover.Target>
                            <Popover.Dropdown>
                                <Highlight highlight="1234567" color="success" size="sm" className="animation-pulse">
                                    https://osu.ppy.sh/beatmaps/7654321#osu/1234567
                                </Highlight>
                            </Popover.Dropdown>
                        </Popover>{" "}
                        (not beatmapset) IDs and/or full URLs into the text area below.
                    </Text>
                    <Divider />
                    <Textarea
                        label="Beatmap IDs"
                        description="Enter beatmap IDs, and/or URLs. Separators like spaces, commas, and newlines are supported."
                        placeholder="e.g. 1234567 https://osu.ppy.sh/beatmaps/7654321#osu/1234567 112233,445566"
                        autosize
                        resize="vertical"
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                    />
                    <Button
                        onClick={handleSubmit}
                        loading={isPending}
                        leftSection={<FontAwesomeIcon icon="check" />}
                        disabled={!input.trim()}>
                        Check Compliance
                    </Button>
                </Stack>
            </Card>

            {complianceData && <Divider />}

            {isPending ? (
                <LoadingState />
            ) : (
                complianceData && (
                    <Stack gap="lg">
                        {statusAlert(complianceData)}
                        {complianceData.errors.length > 0 && (
                            <ResultSection
                                title="Failed to Check"
                                color="gray"
                                icon="exclamation-triangle"
                                items={complianceData.errors}
                                renderItem={(id) => (
                                    <Card key={id} shadow="sm" p="md" bg="primary.10">
                                        <Group>
                                            <FontAwesomeIcon icon="exclamation-triangle" />
                                            <Text>Failed to fetch beatmap id: {id}</Text>
                                        </Group>
                                    </Card>
                                )}
                            />
                        )}
                        <ResultSection
                            title="Disallowed Beatmaps"
                            color="danger"
                            icon="times-circle"
                            items={complianceData.disallowed}
                            renderItem={(beatmap) => <BeatmapCard key={beatmap.id} beatmap={beatmap} />}
                        />
                        <ResultSection
                            title="Potentially Disallowed Beatmaps"
                            color="warning"
                            icon="exclamation-circle"
                            items={complianceData.partial}
                            renderItem={(beatmap) => (
                                <BeatmapCard key={beatmap.id} beatmap={beatmap} notes={beatmap.notes} />
                            )}
                        />
                        <ResultSection
                            title="Allowed Beatmaps"
                            color="success"
                            icon="check-circle"
                            items={complianceData.allowed}
                            renderItem={(beatmap) => <BeatmapCard key={beatmap.id} beatmap={beatmap} />}
                        />
                    </Stack>
                )
            )}
        </Stack>
    );
}
