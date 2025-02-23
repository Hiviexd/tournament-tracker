import { useState } from "react";
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

interface IProps {
    voting: IVoting;
    user: IUser;
}

export default function VotingForm({ voting, user }: IProps) {
    const submitVoteMutation = useSubmitVote(voting._id);
    const userVote = voting.votes.find((vote) => vote.author._id === user._id);

    const [comment, setComment] = useState(userVote?.comment ?? "");
    const [voteData, setVoteData] = useState<VoteType>(() => helpers.getInitialVoteData(voting, userVote));

    const handleSubmit = async () => {
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
            <Stack gap="md">
                <Title order={3}>{userVote ? "Your Vote" : "Submit Your Vote"}</Title>

                {renderVoteInput()}

                <Textarea
                    label="Comment (optional)"
                    placeholder="Add a comment to your vote"
                    value={comment}
                    onChange={(e) => setComment(e.currentTarget.value)}
                    minRows={3}
                    maxRows={8}
                    autosize
                    description={<TextLengthIndicator length={comment.length} maxLength={6000} />}
                />

                <Group justify="flex-end">
                    <Button
                        onClick={handleSubmit}
                        loading={submitVoteMutation.isPending}
                        leftSection={<FontAwesomeIcon icon={userVote ? "edit" : "check"} />}>
                        {userVote ? "Update Vote" : "Submit Vote"}
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
