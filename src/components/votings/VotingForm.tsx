import { useState, useEffect } from "react";
import { Card, Stack, Title, Radio, Slider, Textarea, Button, Group, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import { useSubmitVote } from "../../hooks/useVotings";
import { VoteType, ClassicVote, BinaryVote, VariableVote } from "../../../interfaces/Vote";

interface IProps {
    voting: IVoting;
    user: IUser;
}

export default function VotingForm({ voting, user }: IProps) {
    const submitVoteMutation = useSubmitVote(voting._id);
    const userVote = voting.votes.find((vote) => vote.author._id === user._id);

    // Initialize comment from existing vote if it exists
    const [comment, setComment] = useState(userVote?.comment ?? "");

    // Update comment when userVote changes
    useEffect(() => {
        if (userVote?.comment) {
            setComment(userVote.comment);
        }
    }, [userVote]);

    const [voteData, setVoteData] = useState<VoteType>(() => {
        if (userVote) {
            return userVote.data;
        }

        // Initialize based on voting type
        switch (voting.type) {
            case "classic":
                return { type: "classic", option: 0 } as ClassicVote;
            case "binary":
                return { type: "binary", score: 0 } as BinaryVote;
            case "variable":
                return {
                    type: "variable",
                    scores: voting.options.map((_, index) => ({
                        optionIndex: index,
                        score: 0,
                    })),
                } as VariableVote;
        }
    });

    const handleSubmit = async () => {
        try {
            await submitVoteMutation.mutateAsync({
                data: voteData,
                comment: comment.trim() || undefined,
            });
            // Only clear comment if this is a new vote
            if (!userVote && submitVoteMutation.isSuccess) {
                setComment("");
            }
        } catch (error) {
            console.error("Failed to submit vote:", error);
        }
    };

    const renderVoteInput = () => {
        switch (voting.type) {
            case "classic": {
                const classicVote = voteData as ClassicVote;
                return (
                    <Radio.Group
                        value={classicVote.option.toString()}
                        onChange={(value) =>
                            setVoteData({
                                type: "classic",
                                option: Number(value),
                            })
                        }
                        label="Select your option"
                        withAsterisk>
                        <Stack gap="xs">
                            {voting.options.map((option, index) => (
                                <Radio key={index} value={index.toString()} label={option} />
                            ))}
                        </Stack>
                    </Radio.Group>
                );
            }

            case "binary": {
                const binaryVote = voteData as BinaryVote;
                return (
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text>{voting.options[1]}</Text>
                            <Text>{voting.options[0]}</Text>
                        </Group>
                        <Slider
                            value={binaryVote.score}
                            onChange={(value) =>
                                setVoteData({
                                    type: "binary",
                                    score: value,
                                })
                            }
                            min={-5}
                            max={5}
                            step={1}
                            marks={[
                                { value: -5, label: "-5" },
                                { value: 0, label: "0" },
                                { value: 5, label: "5" },
                            ]}
                        />
                    </Stack>
                );
            }

            case "variable": {
                const variableVote = voteData as VariableVote;
                return (
                    <Stack gap="md">
                        {voting.options.map((option, index) => (
                            <Stack key={index} gap="xs">
                                <Text size="sm">{option}</Text>
                                <Slider
                                    value={variableVote.scores.find((s) => s.optionIndex === index)?.score ?? 0}
                                    onChange={(value) => {
                                        setVoteData({
                                            type: "variable",
                                            scores: variableVote.scores.map((s) =>
                                                s.optionIndex === index ? { ...s, score: value } : s
                                            ),
                                        });
                                    }}
                                    min={-5}
                                    max={5}
                                    step={1}
                                    marks={[
                                        { value: -5, label: "-5" },
                                        { value: 0, label: "0" },
                                        { value: 5, label: "5" },
                                    ]}
                                />
                            </Stack>
                        ))}
                    </Stack>
                );
            }
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
