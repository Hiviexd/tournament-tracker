// Base
import moment from "moment";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import { useToggleVotingStatus, useDeleteVoting } from "../../hooks/useVotings";

// Mantine
import { Card, Stack, Group, Title, Text, Badge, Button, ActionIcon, Divider, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@mantine/hooks";

// Components
import VotingEditModal from "./VotingEditModal";
import DueDateBadge from "../common/badges/DueDateBadge";
import VoteCountBadge from "../common/badges/VoteCountBadge";
import MarkdownText from "../common/MarkdownText";
import UserCard from "../common/UserCard";
import AttachmentDisplay from "../common/AttachmentDisplay";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";

interface IProps {
    voting: IVoting;
    user: IUser | null;
    onNavigateBack: () => void;
}

export default function VotingInfo({ voting, user, onNavigateBack }: IProps) {
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const toggleStatusMutation = useToggleVotingStatus(voting.id);
    const deleteVotingMutation = useDeleteVoting();
    const sortedGroups = [...voting.assignedGroups].sort((a, b) => b.localeCompare(a));

    const checkUserVoted = (): boolean => {
        return !!voting.votes.find((vote) => vote.author._id === user?._id);
    };

    const getVotingTypeInfo = (): { icon: IconProp; text: string; color: string } => {
        switch (voting.category) {
            case "tournament":
                return { icon: "trophy", text: "Tournament", color: "orange" };
            case "user":
                return { icon: "user", text: "User", color: "red" };
            case "discussion":
                return { icon: "comments", text: "Discussion", color: "blue" };
            default:
                return { icon: "question", text: "Unknown", color: "gray" };
        }
    };

    const handleToggleStatus = async () => {
        if (!window.confirm("Are you sure you want to toggle the status of this voting?")) return;
        await toggleStatusMutation.mutateAsync();
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this voting?")) return;
        await deleteVotingMutation.mutateAsync(voting.id);
        onNavigateBack();
    };

    const handleUserCardClick = (targetUser: IUser) => {
        window.open(`https://osu.ppy.sh/users/${targetUser.osuId}`, "_blank");
    };

    return (
        <>
            <Card
                shadow="sm"
                p="lg"
                radius="md"
                className="voting-info"
                style={
                    {
                        "--card-status-color": voting.isActive
                            ? "var(--mantine-color-success-6)"
                            : "var(--mantine-color-danger-6)",
                    } as React.CSSProperties
                }>
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={4}>
                            <Group align="center" gap="xs">
                                <Title order={2}>{voting.title}</Title>
                                {voting.isActive && (
                                    <ActionIcon variant="subtle" color="info" onClick={openEditModal}>
                                        <FontAwesomeIcon icon="edit" />
                                    </ActionIcon>
                                )}
                            </Group>
                            <Text size="sm" c="dimmed">
                                Created by <UserLink user={voting.author} /> •{" "}
                                {voting.isActive ? (
                                    <Tooltip label={moment(voting.createdAt).format("LLL")}>
                                        <span>{moment(voting.createdAt).fromNow()}</span>
                                    </Tooltip>
                                ) : (
                                    <Tooltip label={moment(voting.updatedAt).format("LLL")}>
                                        <span>concluded {moment(voting.updatedAt).fromNow()}</span>
                                    </Tooltip>
                                )}
                            </Text>
                        </Stack>
                        <Group gap="xs">
                            <Tooltip label={getVotingTypeInfo().text}>
                                <Badge color={getVotingTypeInfo().color} variant="filled">
                                    <FontAwesomeIcon icon={getVotingTypeInfo().icon} />
                                </Badge>
                            </Tooltip>
                            {sortedGroups.map((group, index) => (
                                <UserGroupBadge key={index} group={group} tooltip="top" />
                            ))}
                            <Badge color={voting.isActive ? "success" : "danger"} variant="light">
                                {voting.isActive ? "Active" : "Concluded"}
                            </Badge>
                        </Group>
                    </Group>

                    <Group wrap="wrap" gap="xs">
                        <VoteCountBadge
                            voteCount={voting.votes.length}
                            totalVotes={voting.requiredVotes}
                            variant="light"
                        />
                        {voting.isActive && <DueDateBadge date={voting.deadline} variant="light" />}
                        {!checkUserVoted() && user && (
                            <Badge color="orange" variant="light">
                                <FontAwesomeIcon icon="exclamation-triangle" /> Not voted
                            </Badge>
                        )}
                    </Group>

                    <Divider />
                    <MarkdownText content={voting.description} />
                    <Divider />
                    {voting.targetUser && (
                        <>
                            <Stack gap="sm" maw={300}>
                                <Text size="sm" c="dimmed">
                                    Target User
                                </Text>
                                <UserCard
                                    user={voting.targetUser}
                                    onClick={() => handleUserCardClick(voting.targetUser!)}
                                />
                            </Stack>
                        </>
                    )}
                    {voting.attachments?.length > 0 && (
                        <Stack gap="sm">
                            <Text size="sm" c="dimmed">
                                Attachments
                            </Text>
                            <Group gap="sm">
                                {voting.attachments.map((attachment) => (
                                    <AttachmentDisplay key={attachment._id} attachment={attachment} />
                                ))}
                            </Group>
                        </Stack>
                    )}
                    <Group>
                        <Button
                            variant="filled"
                            color="warning"
                            onClick={handleToggleStatus}
                            loading={toggleStatusMutation.isPending}
                            leftSection={<FontAwesomeIcon icon={voting.isActive ? "lock" : "lock-open"} />}>
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
