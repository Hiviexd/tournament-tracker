import { Card, Stack, Badge, Text, Progress, Group, Box } from "@mantine/core";
import { IVote } from "../../../interfaces/Vote";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import { VOTE_COLORS } from "../../constants";

const getScoreColor = (score: number, separator: string = ".") => {
    if (score === 0) return "gray" + separator + "2";
    const intensity = Math.abs(score);
    const level = Math.round((intensity / 5) * 8); // Map 0-5 to color levels 1-8
    const color = score > 0 ? "green" : "red";
    return `${color}${separator}${level}`;
};

interface IProps {
    vote: IVote;
    options: string[];
}

export default function VoteCard({ vote, options }: IProps) {
    const getVoteBorderColor = () => {
        let color = "var(--mantine-color-primary-6)";

        switch (vote.data.type) {
            case "classic":
                color = VOTE_COLORS[vote.data.option % VOTE_COLORS.length];
                break;
            case "binary":
                color = `var(--mantine-color-${getScoreColor(vote.data.score, "-")})`;
                break;
            case "variable": {
                const avgScore = vote.data.scores.reduce((sum, s) => sum + s.score, 0) / vote.data.scores.length;
                color = `var(--mantine-color-${getScoreColor(avgScore, "-")})`;
                break;
            }
        }

        return color;
    };

    const renderVoteData = () => {
        switch (vote.data.type) {
            case "classic":
                return (
                    <Badge size="lg" variant="light" color={VOTE_COLORS[vote.data.option % VOTE_COLORS.length]}>
                        {options[vote.data.option]}
                    </Badge>
                );

            case "binary":
                // eslint-disable-next-line no-case-declarations
                const color = getScoreColor(vote.data.score);

                return (
                    <Stack gap="xs">
                        <Badge size="lg" variant="light" color={color}>
                            Score: {vote.data.score}
                        </Badge>
                        <Progress value={((vote.data.score + 5) / 10) * 100} color={color} size="sm" radius="xl" />
                    </Stack>
                );

            case "variable":
                return (
                    <Card bg="primary.11" p="xs" radius="sm" withBorder>
                        <Stack gap={4}>
                            {vote.data.scores.map((score) => {
                                const color = getScoreColor(score.score);

                                return (
                                    <Group key={score.optionIndex} wrap="nowrap">
                                        <Text size="sm" w={120} truncate title={options[score.optionIndex]}>
                                            {options[score.optionIndex]}
                                        </Text>
                                        <Badge
                                            size="sm"
                                            variant="light"
                                            color={color}
                                            w={40}
                                            style={{ textAlign: "center" }}>
                                            {score.score}
                                        </Badge>
                                    </Group>
                                );
                            })}
                        </Stack>
                    </Card>
                );
        }
    };

    return (
        <Card
            bg="primary.10"
            shadow="xs"
            p="md"
            radius="md"
            style={{
                borderLeft: `4px solid ${getVoteBorderColor()}`,
            }}>
            <Box>
                <Box style={{ float: "right", marginLeft: "var(--mantine-spacing-md)" }}>{renderVoteData()}</Box>
                <Box>
                    <UserDisplay user={vote.author} />
                    {vote.comment && (
                        <Box mt="xs">
                            <MarkdownText content={vote.comment} />
                        </Box>
                    )}
                </Box>
            </Box>
        </Card>
    );
}
