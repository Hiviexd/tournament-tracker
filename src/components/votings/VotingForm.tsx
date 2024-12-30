import { Card, Stack, Group, Title, Button, Textarea, Radio } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { useState, useEffect } from "react";
import { useSubmitVote } from "../../hooks/useVotings";
import { IUser } from "../../../interfaces/User";

interface IProps {
    votingId: string;
    voting: IVoting;
    user: IUser;
}

export default function VotingForm({ votingId, voting, user }: IProps) {
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [comment, setComment] = useState("");
    const submitVoteMutation = useSubmitVote(votingId);
    const userVote = voting.votes.find((vote) => vote.author._id === user._id);

    useEffect(() => {
        if (userVote) {
            setSelectedOption(userVote.option.toString());
            setComment(userVote.comment || "");
        }
    }, [userVote]);

    const handleSubmit = async () => {
        await submitVoteMutation.mutateAsync({
            option: Number(selectedOption),
            comment,
        });
    };

    return (
        <Card shadow="sm" p="lg" bg="primary.11">
            <Stack gap="md">
                <Title order={3}>{userVote ? "Your Vote" : "Submit Your Vote"}</Title>
                <Radio.Group
                    label="Select your option"
                    value={selectedOption}
                    onChange={setSelectedOption}
                    withAsterisk>
                    <Stack mt="xs">
                        {voting.options.map((option, index) => (
                            <Radio key={index} value={index.toString()} label={option} />
                        ))}
                    </Stack>
                </Radio.Group>
                <Textarea
                    label="Comment"
                    placeholder="Add a comment to your vote"
                    value={comment}
                    onChange={(e) => setComment(e.currentTarget.value)}
                    minRows={3}
                />
                <Group>
                    <Button
                        onClick={handleSubmit}
                        loading={submitVoteMutation.isPending}
                        disabled={!selectedOption}
                        leftSection={<FontAwesomeIcon icon="vote-yea" />}>
                        {userVote ? "Update Vote" : "Submit Vote"}
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
