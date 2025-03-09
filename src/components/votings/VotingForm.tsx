import { useState, useMemo } from "react";
import { Card, Stack, Title, Button, Group, Box, Badge } from "@mantine/core";
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
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";

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
    const autoSaveKey = `voting-comment-${voting._id}`;
    const userHasVoted = voting.votes.some((vote) => vote.author && vote.author._id === user._id);

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
                // Clear autosaved comment after successful submission
                clearAutoSavedValue(autoSaveKey);
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
                <Group>
                    <Title order={3}>{userVote ? "Your Vote" : "Submit Your Vote"}</Title>
                    {userHasVoted && (
                        <Badge size="sm" color="info" variant="light" leftSection={<FontAwesomeIcon icon="check-to-slot" />}>
                            Voted
                        </Badge>
                    )}
                </Group>

                {renderVoteInput()}

                <Box>
                    <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                            Comment
                            {isCommentRequired && <span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>}
                            {!isCommentRequired && " (Optional)"}
                        </Box>
                        <TextLengthIndicator length={comment.length} maxLength={6000} />
                    </Box>
                    <TextEditor
                        value={comment}
                        onChange={setComment}
                        placeholder={
                            isCommentRequired
                                ? "Please explain your extreme vote (-5/-4 or 4/5)"
                                : "Add a comment to your vote"
                        }
                        minHeight={120}
                        maxHeight={300}
                        className={isCommentRequired && !comment.trim() ? "error" : ""}
                        autoSaveKey={autoSaveKey}
                    />
                    {isCommentRequired && !comment.trim() && (
                        <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                            Comment is required for extreme votes
                        </Box>
                    )}
                </Box>

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
