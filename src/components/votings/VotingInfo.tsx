// Base
import moment from "moment";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import { useToggleVotingStatus, useDeleteVoting } from "../../hooks/useVotings";

// Mantine
import { Card, Stack, Group, Title, Text, Badge, Button, ActionIcon, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@mantine/hooks";

// Components
import VotingEditModal from "./VotingEditModal";
import DueDateBadge from "../../components/common/badges/DueDateBadge";
import VoteCountBadge from "../../components/common/badges/VoteCountBadge";

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
                <Stack gap="lg">
                    <Stack gap="xs">
                        <Group align="center" gap="xs">
                            <Title order={2}>{voting.title}</Title>
                            {voting.isActive && (
                                <ActionIcon variant="subtle" color="info" onClick={openEditModal}>
                                    <FontAwesomeIcon icon="edit" />
                                </ActionIcon>
                            )}
                        </Group>

                        <Group wrap="wrap" gap="xs" align="center">
                            <Badge color={voting.isActive ? "success" : "danger"} variant="filled">
                                {voting.isActive ? "Active" : "Concluded"}
                            </Badge>
                            <VoteCountBadge
                                voteCount={voting.votes.length}
                                totalVotes={voting.requiredVotes}
                                variant="light"
                            />
                            {voting.isActive && (
                                <DueDateBadge date={voting.deadline} variant="light" />
                            )}
                        </Group>

                        <Text size="sm" c="dimmed">
                            Created by {voting.author.username} •{" "}
                            {moment(voting.createdAt).fromNow()}
                        </Text>
                    </Stack>
                    <Text>{voting.description}</Text>
                    <Divider />
                    <Group>
                        <Button
                            variant="filled"
                            color={voting.isActive ? "warning" : "green"}
                            onClick={handleToggleStatus}
                            loading={toggleStatusMutation.isPending}
                            leftSection={
                                <FontAwesomeIcon icon={voting.isActive ? "lock" : "lock-open"} />
                            }>
                            {voting.isActive ? "Conclude" : "Reopen"}
                        </Button>
                        {(voting.votes.length || user?.isAdmin) && (
                            <Button
                                variant="filled"
                                color="red"
                                onClick={handleDelete}
                                loading={deleteVotingMutation.isPending}
                                leftSection={<FontAwesomeIcon icon="trash" />}>
                                Delete
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Card>
            <VotingEditModal voting={voting} opened={editModalOpened} onClose={closeEditModal} />
        </>
    );
}
