import { Anchor, Box, Group, Text, Tooltip } from "@mantine/core";
import { Heatmap } from "@mantine/charts";
import dayjs from "dayjs";

interface CommitData {
    [date: string]: number;
}

// Declare global variables from Vite config
declare const __COMMIT_DATA__: CommitData;
declare const __COMMIT_HASH__: string;
declare const __COMMIT_MESSAGE__: string;
declare const __BRANCH_NAME__: string;

export default function CommitHeatmap() {
    const commitData = __COMMIT_DATA__ || {};
    const totalCommits = Object.values(commitData).reduce((sum, count) => sum + count, 0);

    const branchName = __BRANCH_NAME__;

    const latestCommitHash = __COMMIT_HASH__;
    const latestCommitLink = `https://github.com/Hiviexd/tournament-tracker/commit/${latestCommitHash}`;
    const latestCommitDate = Object.keys(commitData).sort((a, b) => dayjs(b).diff(dayjs(a)))[0];

    const commitMessage = __COMMIT_MESSAGE__.split("\n")[0]; // First line of commit message

    const endDate = dayjs().format("YYYY-MM-DD");
    const actualStartDate = dayjs().subtract(1, "year");

    // Day I started seriously working on the project
    const minStartDate = dayjs("2024-12-28");
    const startDate = (actualStartDate.isBefore(minStartDate) ? minStartDate : actualStartDate).format("YYYY-MM-DD");

    return (
        <Box>
            <Group mb="md" gap="xs" align="center" justify="space-between">
                <Text size="sm" fw={500}>
                    {branchName} branch — {totalCommits} total commits
                </Text>
                <Text size="sm" fw={500}>
                    Latest commit —{" "}
                    <Tooltip label={commitMessage}>
                        <Anchor size="sm" fw={500} href={latestCommitLink} target="_blank" rel="noopener noreferrer">
                            {latestCommitHash.substring(0, 7)} ({dayjs(latestCommitDate).format("DD MMM, YYYY")})
                        </Anchor>
                    </Tooltip>
                </Text>
            </Group>
            {Object.keys(commitData).length > 0 ? (
                <Heatmap
                    data={commitData}
                    startDate={startDate}
                    endDate={endDate}
                    colors={[
                        "var(--mantine-color-primary-2)",
                        "var(--mantine-color-primary-3)",
                        "var(--mantine-color-primary-4)",
                        "var(--mantine-color-primary-5)",
                        "var(--mantine-color-primary-6)",
                        "var(--mantine-color-primary-7)",
                        "var(--mantine-color-primary-8)",
                        "var(--mantine-color-primary-9)",
                    ]}
                    withTooltip
                    withWeekdayLabels
                    withMonthLabels
                    splitMonths
                    withOutsideDates={false}
                    getTooltipLabel={({ date, value }) =>
                        `${dayjs(date).format("DD MMM, YYYY")} – ${
                            value === null || value === 0
                                ? "No contributions"
                                : `${value} contribution${value > 1 ? "s" : ""}`
                        }`
                    }
                />
            ) : (
                <Text size="sm" c="dimmed">
                    No commit data available
                </Text>
            )}
        </Box>
    );
}
