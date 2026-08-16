import { Card, Stack, Badge, Progress, Group, Box, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { IVote } from "@tc/types/Vote";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import { VOTE_COLORS } from "../../constants";
import { TruncatedText } from "../common/TruncatedText";

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

const getBinaryStrictDisplay = (score: number, options: string[], allowNeutralVotes: boolean) => {
    const agreeOption = options[0];
    const disagreeOption = allowNeutralVotes ? options[2] : options[1];
    const neutralOption = allowNeutralVotes ? options[1] : null;

    switch (score) {
        case 1:
            return { label: agreeOption, color: "success" };
        case 0:
            return { label: neutralOption, color: "gray" };
        case -1:
            return { label: disagreeOption, color: "danger" };
        default:
            return { label: "Unknown", color: "gray" };
    }
};

type RankedChoiceDisplay = { icon: IconProp; count: number; tooltip: string };

const getRankedChoiceDisplay = (score: number): RankedChoiceDisplay => {
    switch (score) {
        case -2:
            return { icon: "thumbs-down", count: 2, tooltip: "Strongly Disagree" };
        case -1:
            return { icon: "thumbs-down", count: 1, tooltip: "Disagree" };
        case 0:
            return { icon: "minus", count: 1, tooltip: "Neutral" };
        case 1:
            return { icon: "thumbs-up", count: 1, tooltip: "Agree" };
        case 2:
            return { icon: "thumbs-up", count: 2, tooltip: "Strongly Agree" };
        default:
            return { icon: "question", count: 1, tooltip: "Unknown" };
    }
};

interface IProps {
    vote: IVote;
    options: string[];
    allowNeutralVotes: boolean;
}

export default function VoteCard({ vote, options, allowNeutralVotes }: IProps) {
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
                color = `var(--mantine-color-${getBinaryStrictDisplay(vote.data.score, options, allowNeutralVotes).color}-6)`;
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
                    <Badge
                        size="lg"
                        variant="light"
                        color={getBinaryStrictDisplay(vote.data.score, options, allowNeutralVotes).color}>
                        {getBinaryStrictDisplay(vote.data.score, options, allowNeutralVotes).label}
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
                                        <TruncatedText size="sm" w={{ base: 500, sm: 200 }}>
                                            {options[score.optionIndex]}
                                        </TruncatedText>
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
                            {vote.data.scores
                                .sort((a, b) => a.optionIndex - b.optionIndex)
                                .map((score) => {
                                    const color = getRankedChoiceScoreColor(score.score);

                                    return (
                                        <Group key={score.optionIndex} wrap="nowrap" justify="space-between">
                                            <TruncatedText size="sm" w={{ base: 500, sm: 200 }}>
                                                {options[score.optionIndex]}
                                            </TruncatedText>
                                            <Tooltip label={getRankedChoiceDisplay(score.score).tooltip}>
                                                <Badge
                                                    size="sm"
                                                    variant="outline"
                                                    color={color}
                                                    w={{ base: 100, xs: 40 }}
                                                    style={{ textAlign: "center" }}>
                                                    {Array.from({
                                                        length: getRankedChoiceDisplay(score.score).count,
                                                    }).map((_, index) => (
                                                        <FontAwesomeIcon
                                                            key={index}
                                                            icon={getRankedChoiceDisplay(score.score).icon}
                                                            style={{
                                                                marginRight:
                                                                    index <
                                                                    getRankedChoiceDisplay(score.score).count - 1
                                                                        ? "2px"
                                                                        : "0",
                                                            }}
                                                        />
                                                    ))}
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

// TODO: split into multiple components, and group components in ./votes by type
