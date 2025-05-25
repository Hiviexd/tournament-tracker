import { Card, Stack, Badge, Text, Progress, Group, Box, Tooltip } from "@mantine/core";
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

const getRankedChoiceScoreColor = (score: number, separator: string = ".") => {
    if (score === 0) return "gray" + separator + "6";
    const intensity = Math.abs(score) / 2; // -2 to 2 scale, normalize to 0-1
    const level = Math.round(intensity * 8); // Map to color levels 1-8
    const color = score > 0 ? "green" : "red";
    return `${color}${separator}${level}`;
};

const getBinaryStrictLabel = (score: number) => {
    switch (score) {
        case 1:
            return "Agree";
        case 0:
            return "Neutral";
        case -1:
            return "Disagree";
        default:
            return "Unknown";
    }
};

const getBinaryStrictColor = (score: number) => {
    switch (score) {
        case 1:
            return "success";
        case 0:
            return "gray";
        case -1:
            return "danger";
        default:
            return "gray";
    }
};

const getRankedChoiceLabel = (score: number) => {
    switch (score) {
        case -2:
            return "DD";
        case -1:
            return "D";
        case 0:
            return "N";
        case 1:
            return "A";
        case 2:
            return "AA";
        default:
            return "?";
    }
};

const getRankedChoiceTooltip = (score: number) => {
    switch (score) {
        case -2:
            return "Strongly Disagree";
        case -1:
            return "Disagree";
        case 0:
            return "Neutral";
        case 1:
            return "Agree";
        case 2:
            return "Strongly Agree";
        default:
            return "Unknown";
    }
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
            case "binary-strict":
                color = `var(--mantine-color-${getBinaryStrictColor(vote.data.score)}-6)`;
                break;
            case "variable": {
                const avgScore = vote.data.scores.reduce((sum, s) => sum + s.score, 0) / vote.data.scores.length;
                color = `var(--mantine-color-${getScoreColor(avgScore, "-")})`;
                break;
            }
            case "ranked-choice": {
                const avgScore = vote.data.scores.reduce((sum, s) => sum + s.score, 0) / vote.data.scores.length;
                color = `var(--mantine-color-${getRankedChoiceScoreColor(avgScore, "-")})`;
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

            case "binary-strict":
                return (
                    <Badge size="lg" variant="light" color={getBinaryStrictColor(vote.data.score)}>
                        {getBinaryStrictLabel(vote.data.score)}
                    </Badge>
                );

            case "variable":
                return (
                    <Card bg="primary.11" p="xs" radius="sm" withBorder>
                        <Stack gap={4}>
                            {vote.data.scores.map((score) => {
                                const color = getScoreColor(score.score);

                                return (
                                    <Group key={score.optionIndex} wrap="nowrap" justify="space-between">
                                        <Text
                                            size="sm"
                                            w={{ base: 500, sm: 200 }}
                                            truncate
                                            title={options[score.optionIndex]}>
                                            {options[score.optionIndex]}
                                        </Text>
                                        <Badge
                                            size="sm"
                                            variant="light"
                                            color={color}
                                            w={{ base: 60, sm: 40 }}
                                            style={{ textAlign: "center" }}>
                                            {score.score}
                                        </Badge>
                                    </Group>
                                );
                            })}
                        </Stack>
                    </Card>
                );

            case "ranked-choice":
                return (
                    <Card bg="primary.11" p="xs" radius="sm" withBorder>
                        <Stack gap={4}>
                            {vote.data.scores.map((score) => {
                                const color = getRankedChoiceScoreColor(score.score);

                                return (
                                    <Group key={score.optionIndex} wrap="nowrap" justify="space-between">
                                        <Text
                                            size="sm"
                                            w={{ base: 500, sm: 200 }}
                                            truncate
                                            title={options[score.optionIndex]}>
                                            {options[score.optionIndex]}
                                        </Text>
                                        <Tooltip label={getRankedChoiceTooltip(score.score)}>
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={color}
                                                w={{ base: 60, sm: 40 }}
                                                style={{ textAlign: "center" }}>
                                                {getRankedChoiceLabel(score.score)}
                                            </Badge>
                                        </Tooltip>
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
                <Box display={{ base: "block", sm: "none" }}>
                    <Stack gap="md">
                        <UserDisplay user={vote.author} />
                        {renderVoteData()}
                        {vote.comment && (
                            <Box>
                                <MarkdownText content={vote.comment} />
                            </Box>
                        )}
                    </Stack>
                </Box>

                <Box display={{ base: "none", sm: "block" }}>
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
            </Box>
        </Card>
    );
}
