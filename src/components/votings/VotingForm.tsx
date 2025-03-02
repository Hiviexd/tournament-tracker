import { useState, useMemo } from "react";
import { Card, Stack, Title, Textarea, Button, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import { useSubmitVote } from "../../hooks/useVotings";
import { VoteType, ClassicVote, BinaryVote, VariableVote } from "../../../interfaces/Vote";
import helpers from "../../helpers";
import ClassicVoteInput from "./votes/ClassicVoteInput";
import BinaryVoteInput from "./votes/BinaryVoteInput";
import VariableVoteInput from "./votes/VariableVoteInput";
import TextLengthIndicator from "../common/TextLengthIndicator";

const isExtremeVote = (value: number) => Math.abs(value) >= 4;

interface IProps {
    voting: IVoting;
    user: IUser;
}

export default function VotingForm({ voting, user }: IProps) {
    const submitVoteMutation = useSubmitVote(voting._id);
    const userVote = voting.votes.find((vote) => vote.author._id === user._id);

    const [comment, setComment] = useState(userVote?.comment ?? "");
    const [voteData, setVoteData] = useState<VoteType>(() => helpers.getInitialVoteData(voting, userVote));

    const isCommentRequired = useMemo(() => {
        switch (voteData.type) {
            case "binary":
                return isExtremeVote(voteData.score);
            case "variable":
                return voteData.scores.some((s) => isExtremeVote(s.score));
            default:
                return false;
        }
    }, [voteData]);

    const handleSubmit = async () => {
        if (isCommentRequired && !comment.trim()) {
            return; // Button will be disabled, but extra safety check
        }

        try {
            await submitVoteMutation.mutateAsync({
                data: voteData,
                comment: comment.trim() || undefined,
            });
            if (!userVote && submitVoteMutation.isSuccess) {
                setComment("");
            }
        } catch (error) {
            console.error("Failed to submit vote:", error);
        }
    };

    const renderVoteInput = () => {
        switch (voting.type) {
            case "classic":
                return (
                    <ClassicVoteInput
                        options={voting.options}
                        value={(voteData as ClassicVote).option}
                        onChange={(value) => setVoteData({ type: "classic", option: value })}
                    />
                );

            case "binary":
                return (
                    <BinaryVoteInput
                        options={[voting.options[0], voting.options[1]]}
                        value={(voteData as BinaryVote).score}
                        onChange={(value) => setVoteData({ type: "binary", score: value })}
                    />
                );

            case "variable":
                return (
                    <VariableVoteInput
                        options={voting.options}
                        values={(voteData as VariableVote).scores}
                        onChange={(optionIndex, score) => {
                            setVoteData({
                                type: "variable",
                                scores: (voteData as VariableVote).scores.map((s) =>
                                    s.optionIndex === optionIndex ? { ...s, score } : s
                                ),
                            });
                        }}
                    />
                );
        }
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="lg">
                <Title order={3}>{userVote ? "Your Vote" : "Submit Your Vote"}</Title>

                {renderVoteInput()}

                <Textarea
                    label={`Comment${isCommentRequired ? " (Required for extreme votes)" : " (Optional)"}`}
                    placeholder={
                        isCommentRequired
                            ? "Please explain your extreme vote (-5/-4 or 4/5)"
                            : "Add a comment to your vote"
                    }
                    value={comment}
                    onChange={(e) => setComment(e.currentTarget.value)}
                    minRows={3}
                    maxRows={8}
                    mt="lg"
                    autosize
                    required={isCommentRequired}
                    error={isCommentRequired && !comment.trim() ? "Comment is required for extreme votes" : null}
                    description={<TextLengthIndicator length={comment.length} maxLength={6000} />}
                />

                <Group justify="flex-end">
                    <Button
                        onClick={handleSubmit}
                        loading={submitVoteMutation.isPending}
                        disabled={isCommentRequired && !comment.trim()}
                        leftSection={<FontAwesomeIcon icon={userVote ? "edit" : "check"} />}>
                        {userVote ? "Update Vote" : "Submit Vote"}
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
