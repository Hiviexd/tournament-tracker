import { Card, Stack, Badge, Text, Progress, Group, Box } from "@mantine/core";
import { IVote } from "../../../interfaces/Vote";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import { VOTE_COLORS } from "../../constants";

interface IProps {
    vote: IVote;
    options: string[];
}

export default function VoteCard({ vote, options }: IProps) {
    const getVoteBorderColor = () => {
        switch (vote.data.type) {
            case "classic":
                return VOTE_COLORS[vote.data.option % VOTE_COLORS.length];
            case "binary":
                return `var(--mantine-color-${vote.data.score > 0 ? "green" : vote.data.score < 0 ? "red" : "gray"}-6)`;
            default:
                return "var(--mantine-color-primary-6)";
        }
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
                const color = vote.data.score > 0 ? "green" : vote.data.score < 0 ? "red" : "gray";

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
                                const color = score.score > 0 ? "green" : score.score < 0 ? "red" : "gray";

                                return (
                                    <Group key={score.optionIndex} wrap="nowrap">
                                        <Text size="sm" w={100} truncate title={options[score.optionIndex]}>
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
