import { Card, Stack, Group, Title, Text, Badge, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import moment from "moment";
import { useDisclosure } from "@mantine/hooks";
import { useToggleVotingStatus, useDeleteVoting } from "../../hooks/useVotings";
import VotingEditModal from "./VotingEditModal";

interface IProps {
    votingId: string;
    voting: IVoting;
    user: IUser | null;
    onNavigateBack: () => void;
}

export default function VotingInfo({ votingId, voting, user, onNavigateBack }: IProps) {
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const toggleStatusMutation = useToggleVotingStatus(votingId);
    const deleteVotingMutation = useDeleteVoting();
    const isAuthor = voting.author._id === user?._id;

    const handleToggleStatus = async () => {
        await toggleStatusMutation.mutateAsync();
    };

    const handleDelete = async () => {
        await deleteVotingMutation.mutateAsync(votingId);
        onNavigateBack();
    };

    return (
        <>
            <Card shadow="sm" p="lg" bg="primary.11">
                <Stack gap="md">
                    <Group>
                        <div>
                            <Group>
                                <Title order={2}>{voting.title}</Title>
                                <Group wrap="wrap" gap="xs" align="center">
                                    <Badge
                                        color={voting.isActive ? "success" : "danger"}
                                        variant="filled">
                                        {voting.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Badge
                                        color={
                                            voting.votes.length === voting.requiredVotes
                                                ? "success"
                                                : "danger"
                                        }
                                        variant="light">
                                        {voting.votes.length} / {voting.requiredVotes} votes
                                    </Badge>
                                    {voting.isActive && (
                                        <Badge
                                            color={
                                                moment().isAfter(voting.deadline) ? "red" : "green"
                                            }
                                            variant="light">
                                            Due {moment(voting.deadline).fromNow()}
                                        </Badge>
                                    )}
                                </Group>
                            </Group>

                            <Text size="sm" c="dimmed">
                                Created by {voting.author.username} •{" "}
                                {moment(voting.createdAt).fromNow()}
                            </Text>
                        </div>
                    </Group>
                    <Text>{voting.description}</Text>
                    {(isAuthor || user?.isAdmin) && (
                        <Group>
                            <Button
                                variant="filled"
                                color="blue"
                                onClick={openEditModal}
                                leftSection={<FontAwesomeIcon icon="edit" />}>
                                Edit
                            </Button>
                            <Button
                                variant="filled"
                                color={voting.isActive ? "red" : "green"}
                                onClick={handleToggleStatus}
                                loading={toggleStatusMutation.isPending}
                                leftSection={
                                    <FontAwesomeIcon icon={voting.isActive ? "times" : "check"} />
                                }>
                                {voting.isActive ? "Close" : "Reopen"}
                            </Button>
                            <Button
                                variant="filled"
                                color="red"
                                onClick={handleDelete}
                                loading={deleteVotingMutation.isPending}
                                leftSection={<FontAwesomeIcon icon="trash" />}>
                                Delete
                            </Button>
                        </Group>
                    )}
                </Stack>
            </Card>
            <VotingEditModal voting={voting} opened={editModalOpened} onClose={closeEditModal} />
        </>
    );
}
