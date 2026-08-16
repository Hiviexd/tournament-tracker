import { Card, Stack, Box } from "@mantine/core";
import { IVote } from "@tc/types/Vote";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import DateBadge from "../common/badges/DateBadge";
import { VOTE_COLORS } from "../../constants";
import ClassicVoteDisplay from "./votes/ClassicVoteDisplay";
import BinaryVoteDisplay from "./votes/BinaryVoteDisplay";
import BinaryStrictVoteDisplay from "./votes/BinaryStrictVoteDisplay";
import VariableVoteDisplay from "./votes/VariableVoteDisplay";
import RankedChoiceVoteDisplay from "./votes/RankedChoiceVoteDisplay";
import { getScoreCssVar } from "./votes/voteScoreColor";

interface IProps {
    vote: IVote;
    options: string[];
    allowNeutralVotes: boolean;
}

function getVoteAccent(vote: IVote): string {
    switch (vote.data.type) {
        case "classic":
            return VOTE_COLORS[vote.data.option % VOTE_COLORS.length];
        case "binary":
            return getScoreCssVar(vote.data.score);
        case "binary-strict": {
            const color = vote.data.score === 1 ? "success" : vote.data.score === -1 ? "danger" : "gray";
            return `var(--mantine-color-${color}-6)`;
        }
        case "variable":
        case "ranked-choice":
            return "var(--mantine-color-primary-6)";
    }
}

function VoteData({ vote, options, allowNeutralVotes }: IProps) {
    switch (vote.data.type) {
        case "classic":
            return <ClassicVoteDisplay option={vote.data.option} options={options} />;
        case "binary":
            return <BinaryVoteDisplay score={vote.data.score} options={options} />;
        case "binary-strict":
            return (
                <BinaryStrictVoteDisplay
                    score={vote.data.score}
                    options={options}
                    allowNeutralVotes={allowNeutralVotes}
                />
            );
        case "variable":
            return <VariableVoteDisplay scores={vote.data.scores} options={options} />;
        case "ranked-choice":
            return <RankedChoiceVoteDisplay scores={vote.data.scores} options={options} />;
    }
}

export default function VoteCard({ vote, options, allowNeutralVotes }: IProps) {
    return (
        <Card
            bg="primary.10"
            shadow="xs"
            p="sm"
            radius="md"
            style={{
                borderLeft: `4px solid ${getVoteAccent(vote)}`,
            }}>
            <Box display={{ base: "block", sm: "none" }}>
                <Stack gap="sm">
                    <UserDisplay user={vote.author} />
                    <VoteData vote={vote} options={options} allowNeutralVotes={allowNeutralVotes} />
                    {vote.comment && (
                        <Box>
                            <MarkdownText content={vote.comment} />
                        </Box>
                    )}
                    <DateBadge date={vote.createdAt} size="xs" staticColor />
                </Stack>
            </Box>

            <Box display={{ base: "none", sm: "block" }}>
                <Box style={{ float: "right", marginLeft: "var(--mantine-spacing-md)" }}>
                    <VoteData vote={vote} options={options} allowNeutralVotes={allowNeutralVotes} />
                </Box>
                <UserDisplay user={vote.author} />
                {vote.comment && (
                    <Box mt="xs">
                        <MarkdownText content={vote.comment} />
                    </Box>
                )}
                <Box mt="sm" style={{ clear: "both" }}>
                    <DateBadge date={vote.createdAt} size="xs" staticColor />
                </Box>
            </Box>
        </Card>
    );
}
