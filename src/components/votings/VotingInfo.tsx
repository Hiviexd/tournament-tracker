// Base
import moment from "moment";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import { useToggleVotingStatus, useDeleteVoting } from "../../hooks/useVotings";

// Mantine
import {
    Card,
    Stack,
    Group,
    Title,
    Text,
    Badge,
    Button,
    ActionIcon,
    Divider,
    Tooltip,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@mantine/hooks";

// Components
import VotingEditModal from "./VotingEditModal";
import DueDateBadge from "../common/badges/DueDateBadge";
import VoteCountBadge from "../common/badges/VoteCountBadge";
import MarkdownText from "../common/MarkdownText";

interface IProps {
    voting: IVoting;
    user: IUser | null;
    onNavigateBack: () => void;
}

export default function VotingInfo({ voting, user, onNavigateBack }: IProps) {
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const toggleStatusMutation = useToggleVotingStatus(voting.id);
    const deleteVotingMutation = useDeleteVoting();

    const handleToggleStatus = async () => {
        if (!window.confirm("Are you sure you want to toggle the status of this voting?")) return;
        await toggleStatusMutation.mutateAsync();
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this voting?")) return;
        await deleteVotingMutation.mutateAsync(voting.id);
        onNavigateBack();
    };

    return (
        <>
            <Card
                shadow="sm"
                p="lg"
                className="voting-info"
                style={
                    {
                        "--card-status-color": voting.isActive
                            ? "var(--mantine-color-success-6)"
                            : "var(--mantine-color-danger-6)",
                    } as React.CSSProperties
                }>
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
                            <Badge color={voting.isActive ? "success" : "danger"} variant="light">
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
                            {voting.isActive && (
                                <Tooltip label={moment(voting.createdAt).format("LLL")}>
                                    <span>{moment(voting.createdAt).fromNow()}</span>
                                </Tooltip>
                            )}
                            {!voting.isActive && (
                                <Tooltip label={moment(voting.updatedAt).format("LLL")}>
                                    <span>concluded {moment(voting.updatedAt).fromNow()}</span>
                                </Tooltip>
                            )}
                        </Text>
                    </Stack>
                    <Divider />
                    <MarkdownText content={voting.description} />
                    <Divider />
                    <Group>
                        <Button
                            variant="filled"
                            color="warning"
                            onClick={handleToggleStatus}
                            loading={toggleStatusMutation.isPending}
                            leftSection={
                                <FontAwesomeIcon icon={voting.isActive ? "lock" : "lock-open"} />
                            }>
                            {voting.isActive ? "Conclude" : "Reopen"}
                        </Button>
                        {(!voting.votes.length || user?.isAdmin) && (
                            <Button
                                variant="filled"
                                color="danger"
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
