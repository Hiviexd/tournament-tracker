import { useState, useMemo } from "react";
import { Card, Stack, Title, Button, Group, Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import { useSubmitVote, useToggleAbstention } from "../../hooks/useVotings";
import {
    VoteType,
    ClassicVote,
    BinaryVote,
    BinaryStrictVote,
    VariableVote,
    RankedChoiceVote,
} from "../../../interfaces/Vote";
import utils from "../../../utils";
import ClassicVoteInput from "./votes/ClassicVoteInput";
import BinaryVoteInput from "./votes/BinaryVoteInput";
import BinaryStrictVoteInput from "./votes/BinaryStrictVoteInput";
import VariableVoteInput from "./votes/VariableVoteInput";
import RankedChoiceVoteInput from "./votes/RankedChoiceVoteInput";
import TextLengthIndicator from "../common/TextLengthIndicator";
import TextEditor from "../common/TextEditor";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import VoteStatusBanner from "../common/banners/VoteStatusBanner";
import { useConfirmModal } from "../../hooks/useModals";

const isExtremeVote = (value: number) => Math.abs(value) >= 4;

const hasNeutralVote = (voteData: VoteType): boolean => {
    switch (voteData.type) {
        case "binary":
            return voteData.score === 0;
        case "binary-strict":
            return voteData.score === 0;
        case "variable":
            return voteData.scores.some((s) => s.score === 0);
        case "ranked-choice":
            return voteData.scores.some((s) => s.score === 0);
        default:
            return false;
    }
};

interface IProps {
    voting: IVoting;
    user: IUser;
}

export default function VotingForm({ voting, user }: IProps) {
    const submitVoteMutation = useSubmitVote(voting.id);
    const toggleAbstentionMutation = useToggleAbstention(voting.id);
    const confirmModal = useConfirmModal();

    const userVote = voting.votes.find((vote) => vote.author._id === user._id);
    const [comment, setComment] = useState(userVote?.comment ?? "");
    const [voteData, setVoteData] = useState<VoteType>(() => utils.getInitialVoteData(voting, userVote));
    const autoSaveKey = `voting-comment-${voting._id}`;

    const isAbstained = useMemo(
        () =>
            voting.abstainedUsers?.some((abstainedUser) => abstainedUser._id.toString() === user._id.toString()) ??
            false,
        [voting.abstainedUsers, user._id]
    );

    const isCommentRequired = useMemo(() => {
        switch (voteData.type) {
            // Very explicit with declaration for my own sanity
            case "binary":
                return isExtremeVote(voteData.score);
            case "variable":
                return voteData.scores.some((s) => isExtremeVote(s.score));
            case "classic":
            case "binary-strict":
            case "ranked-choice":
                return false;
            default:
                return false;
        }
    }, [voteData]);

    const isSubmitDisabled = useMemo(() => {
        if (isAbstained) {
            return true;
        }

        if (isCommentRequired && !comment.trim()) {
            return true;
        }

        if (
            !voting.allowNeutralVotes &&
            (voting.type === "binary" ||
                voting.type === "variable" ||
                voting.type === "ranked-choice" ||
                voting.type === "binary-strict")
        ) {
            return hasNeutralVote(voteData);
        }

        return false;
    }, [isCommentRequired, comment, voting.allowNeutralVotes, voting.type, voteData, isAbstained]);

    const handleSubmit = async () => {
        if (isSubmitDisabled) {
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

    const handleToggleAbstention = async () => {
        if (
            await confirmModal({
                title: `${isAbstained ? "Remove abstention" : "Abstain"}?`,
                text: `Are you sure you want to ${isAbstained ? "remove your abstention" : "abstain"} from this vote?`,
                confirmText: isAbstained ? "Remove Abstention" : "Abstain",
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon={isAbstained ? "flag" : "flag-checkered"} />,
                    color: isAbstained ? "success" : "warning",
                },
            })
        ) {
            await toggleAbstentionMutation.mutateAsync();
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

            case "binary-strict":
                return (
                    <BinaryStrictVoteInput
                        options={voting.options}
                        value={voteData as BinaryStrictVote}
                        onChange={(vote) => vote && setVoteData(vote)}
                        allowNeutralVotes={voting.allowNeutralVotes}
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

            case "ranked-choice":
                return (
                    <RankedChoiceVoteInput
                        options={voting.options}
                        value={voteData as RankedChoiceVote}
                        onChange={(vote) => vote && setVoteData(vote)}
                    />
                );
        }
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="lg">
                <VoteStatusBanner voting={voting} user={user} isAbstained={isAbstained} />

                {!isAbstained && (
                    <Group gap="xs" align="baseline">
                        <Title order={3}>{userVote ? "Your Vote" : "Submit Your Vote"}</Title>
                    </Group>
                )}

                {!isAbstained && (
                    <Stack gap="md">
                        {renderVoteInput()}
                        <Box>
                            <Group justify="space-between" align="center" mb={5}>
                                <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                    Comment
                                    {isCommentRequired && (
                                        <span style={{ color: "var(--mantine-color-red-filled)" }}> *</span>
                                    )}
                                    {!isCommentRequired && " (Optional)"}
                                </Box>
                                <TextLengthIndicator length={comment.length} maxLength={6000} />
                            </Group>
                            <TextEditor
                                value={comment}
                                disabled={isAbstained}
                                onChange={setComment}
                                placeholder={
                                    isCommentRequired
                                        ? "Please explain your extreme vote (-5/-4 or 4/5)"
                                        : "Add a comment to your vote..."
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
                    </Stack>
                )}

                <Group justify={userVote ? "flex-end" : "space-between"}>
                    {!userVote && (
                        <Button
                            color="gray"
                            variant={isAbstained ? "outline" : "filled"}
                            onClick={handleToggleAbstention}
                            loading={toggleAbstentionMutation.isPending}
                            disabled={!!userVote}
                            leftSection={<FontAwesomeIcon icon={isAbstained ? "flag" : "flag-checkered"} />}>
                            {isAbstained ? "Remove Abstention" : "Abstain"}
                        </Button>
                    )}
                    <Group justify="flex-end">
                        {!voting.allowNeutralVotes && hasNeutralVote(voteData) && (
                            <Text size="xs" c="danger">
                                Neutral votes are not allowed
                            </Text>
                        )}
                        {!isAbstained && (
                            <Button
                                color={userVote ? "info" : "success"}
                                onClick={handleSubmit}
                                loading={submitVoteMutation.isPending}
                                disabled={isSubmitDisabled}
                                leftSection={<FontAwesomeIcon icon={userVote ? "edit" : "check"} />}>
                                {userVote ? "Update Vote" : "Submit Vote"}
                            </Button>
                        )}
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}
