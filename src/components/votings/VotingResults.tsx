import { Card, Stack, Group, Title, Text, Badge, Button, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import moment from "moment";
import { useDeleteVote } from "../../hooks/useVotings";

interface IProps {
    votingId: string;
    voting: IVoting;
    user: IUser | null;
}

export default function VotingResults({ votingId, voting, user }: IProps) {
    const deleteVoteMutation = useDeleteVote(votingId);

    const handleDeleteVote = async (voteId: string) => {
        await deleteVoteMutation.mutateAsync(voteId);
    };

    return (
        <Card shadow="sm" p="lg" bg="primary.11">
            <Stack gap="md">
                <Title order={3}>Votes</Title>
                <Group>
                    {voting.options.map((option, index) => (
                        <Badge key={index} size="lg">
                            {option}: {voting.votes.filter((v) => v.option === index).length}
                        </Badge>
                    ))}
                </Group>
                <Divider />
                <Stack gap="xs">
                    {voting.votes.map((vote) => (
                        <Card key={vote._id} withBorder>
                            <Group>
                                <div>
                                    <Text fw={500}>
                                        {vote.author.username} voted for{" "}
                                        <Text span c="primary">
                                            {voting.options[vote.option]}
                                        </Text>
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {moment(vote.createdAt).fromNow()}
                                    </Text>
                                </div>
                                {user?.isAdmin && (
                                    <Button
                                        variant="subtle"
                                        color="red"
                                        size="sm"
                                        onClick={() => handleDeleteVote(vote._id)}
                                        loading={deleteVoteMutation.isPending}
                                        leftSection={<FontAwesomeIcon icon="trash" />}>
                                        Delete Vote
                                    </Button>
                                )}
                            </Group>
                            {vote.comment && (
                                <Text size="sm" mt="xs">
                                    {vote.comment}
                                </Text>
                            )}
                        </Card>
                    ))}
                </Stack>
            </Stack>
        </Card>
    );
}
