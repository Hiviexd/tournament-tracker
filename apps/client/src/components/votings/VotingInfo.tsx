// Base
import dayjs from "@tc/utils/dayjs";
import { useState } from "react";
import { IVoting } from "@tc/types/Voting";
import { IUser } from "@tc/types/User";
import {
    useToggleVotingStatus,
    useDeleteVoting,
    useToggleVotingPublic,
    useClearVotes,
    useApplySanction,
    useUndoSanction,
} from "../../hooks/useVotings";
import { useConfirmModal } from "../../hooks/useModals";
import { getActiveInfringement, getSanctionAnnouncementChannel, getSanctionApplyState } from "@tc/utils/client";
import startCase from "lodash/startCase.js";

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
    Anchor,
    SegmentedControl,
    Box,
    MantineStyleProp,
    useMantineTheme,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDisclosure } from "@mantine/hooks";
import { useMediaQuery } from "@mantine/hooks";

// Components
import VotingEditModal from "./VotingEditModal";
import DueDateBadge from "../common/badges/DueDateBadge";
import DateBadge from "../common/badges/DateBadge";
import VoteCountBadge from "../common/badges/VoteCountBadge";
import MarkdownText from "../common/MarkdownText";
import UserCard from "../common/UserCard";
import AttachmentDisplay from "../common/AttachmentDisplay";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import NotVotedBadge from "../common/badges/NotVotedBadge";
import VotingTypeBadge from "../common/badges/VotingTypeBadge";
import AlertText from "../common/AlertText";
import { cssVars } from "../../themes/cssVars";
import { pickStringUnion } from "@tc/utils/client";

interface IProps {
    voting: IVoting;
    user: IUser | null;
    onNavigateBack: () => void;
}

export default function VotingInfo({ voting, user, onNavigateBack }: IProps) {
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [descriptionType, setDescriptionType] = useState<"private" | "public">("private");
    const toggleStatusMutation = useToggleVotingStatus(voting.id);
    const togglePublicMutation = useToggleVotingPublic(voting.id);
    const deleteVotingMutation = useDeleteVoting(voting.id);
    const clearVotesMutation = useClearVotes(voting.id);
    const applySanctionMutation = useApplySanction(voting.id);
    const undoSanctionMutation = useUndoSanction(voting.id);
    const sortedGroups = voting.assignedGroups.toSorted((a, b) => b.localeCompare(a));
    const confirmModal = useConfirmModal();
    const sanctionState = getSanctionApplyState(voting);
    const hasActiveInfringement = Boolean(getActiveInfringement(voting.targetUser));

    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);

    const getDueDateColor = (): string => {
        const deadline = dayjs(voting.deadline);
        const now = dayjs();
        if (deadline.isBefore(now)) return "danger";
        if (deadline.isBefore(now.add(24, "hours"))) return "warning";
        return "success";
    };

    const getGradientStyle = (): MantineStyleProp => {
        if (voting.isActive) {
            return cssVars({
                "--card-status-color": `var(--mantine-color-${getDueDateColor()}-6)`,
            });
        }
        return;
    };

    const handleToggleStatus = async () => {
        if (
            !(await confirmModal({
                title: `${voting.isActive ? "Conclude" : "Reopen"} Vote?`,
                text: `Are you sure you want to ${voting.isActive ? "conclude" : "reopen"} this vote?`,
                confirmText: voting.isActive ? "Conclude" : "Reopen",
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon={voting.isActive ? "lock" : "lock-open"} />,
                    color: voting.isActive ? "warning" : "success",
                },
            }))
        )
            return;
        await toggleStatusMutation.mutateAsync();
    };

    const handleTogglePublic = async () => {
        if (
            !(await confirmModal({
                title: voting.isPublic ? "Mark as Private?" : "Mark as Public?",
                text: `Are you sure you want to ${voting.isPublic ? "privatize" : "publish"} this vote?`,
                confirmText: voting.isPublic ? "Mark as Private" : "Mark as Public",
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon={voting.isPublic ? "eye-slash" : "eye"} />,
                    color: voting.isPublic ? "warning" : "blue",
                },
            }))
        )
            return;
        await togglePublicMutation.mutateAsync();
    };

    const handleDelete = async () => {
        if (
            !(await confirmModal({
                preset: "delete",
                title: "Delete Vote?",
                text: "Are you sure you want to delete this vote? This action is irreversible.",
            }))
        )
            return;
        await deleteVotingMutation.mutateAsync();
        onNavigateBack();
    };

    const handleClearVotes = async () => {
        const message = (
            <>
                <Text size="sm" mb="sm">
                    Are you sure you want to clear all submitted votes?
                </Text>
                <AlertText type="warning">Only use this if you intend to delete the vote afterwards.</AlertText>
            </>
        );
        if (
            !(await confirmModal({
                preset: "delete",
                title: "Clear Votes?",
                children: message,
                confirmText: "Clear Votes",
            }))
        )
            return;
        await clearVotesMutation.mutateAsync();
    };

    const handleApplySanction = async () => {
        if (!sanctionState.showButton || sanctionState.disabled || !sanctionState.messages || !voting.sanctionType)
            return;

        const channel = getSanctionAnnouncementChannel({
            isWarning: sanctionState.isWarning,
            isContest: sanctionState.isContest,
            sanctionType: voting.sanctionType,
        });

        const preview = (
            <Stack gap="sm">
                <Text size="sm">
                    Apply a{" "}
                    <Text span fw={600}>
                        {startCase(sanctionState.infringementType)}
                    </Text>{" "}
                    to {voting.targetUser?.username || "the target user"}?
                </Text>
                {hasActiveInfringement && !sanctionState.isWarning && (
                    <AlertText type="warning">
                        This user already has an active infringement. Applying this sanction will expire it.
                    </AlertText>
                )}
                <Text size="sm" fw={600}>
                    Announcement preview
                </Text>
                <Box
                    p="sm"
                    style={{
                        border: "1px solid var(--mantine-color-default-border)",
                        borderRadius: "var(--mantine-radius-sm)",
                    }}>
                    <Text fw={600}>{channel.name}</Text>
                    <Text size="sm" c="dimmed">
                        {channel.description}
                    </Text>
                </Box>
                {sanctionState.messages.map((message, index) => (
                    <Box
                        key={index}
                        p="sm"
                        style={{
                            border: "1px solid var(--mantine-color-default-border)",
                            borderRadius: "var(--mantine-radius-sm)",
                        }}>
                        <MarkdownText content={message} />
                    </Box>
                ))}
            </Stack>
        );

        if (
            !(await confirmModal({
                title: "Apply Sanction?",
                size: "xl",
                children: preview,
                confirmText: "Apply Sanction",
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon="gavel" />,
                    color: "danger",
                },
            }))
        )
            return;

        await applySanctionMutation.mutateAsync();
    };

    const handleUndoSanction = async () => {
        if (
            !(await confirmModal({
                title: "Undo Sanction?",
                children: (
                    <Stack gap="sm">
                        <Text size="sm">
                            This will remove the watchlist entry and reset the vote so the sanction can be applied
                            again.
                        </Text>
                        <AlertText type="warning">
                            The osu! announcement cannot be undone. The user will still have the original messages.
                        </AlertText>
                    </Stack>
                ),
                confirmText: "Undo Sanction",
                confirmProps: {
                    leftSection: <FontAwesomeIcon icon="undo" />,
                    color: "danger",
                },
            }))
        )
            return;

        await undoSanctionMutation.mutateAsync();
    };

    const handleUserCardClick = (targetUser: IUser) => {
        window.open(`https://osu.ppy.sh/users/${targetUser.osuId}`, "_blank");
    };

    const renderDescription = () => {
        if (user?.isCommitteeOrAdmin) {
            return (
                <>
                    <Group align="center">
                        <Text fw={700}>Description</Text>
                        <SegmentedControl
                            size="xs"
                            color="primary"
                            value={descriptionType}
                            onChange={(value) => {
                                const next = pickStringUnion(value, ["private", "public"] as const);
                                if (next) setDescriptionType(next);
                            }}
                            data={[
                                { label: "Private", value: "private" },
                                { label: "Public", value: "public" },
                            ]}
                        />
                    </Group>
                    <Box mt="xs">
                        {descriptionType === "private" ? (
                            <MarkdownText content={voting.description} />
                        ) : voting.publicDescription && voting.publicDescription.trim().length > 0 ? (
                            <MarkdownText content={voting.publicDescription} />
                        ) : (
                            <Text size="sm" c="dimmed" fs="italic">
                                No public description available.
                            </Text>
                        )}
                    </Box>
                </>
            );
        }

        // For non-committee members, only show public description if it exists and is not empty
        return voting.publicDescription && voting.publicDescription.trim().length > 0 ? (
            <MarkdownText content={voting.publicDescription} />
        ) : null;
    };

    return (
        <>
            <Card
                shadow="sm"
                p="lg"
                radius="md"
                className="voting-info"
                data-active={voting.isActive}
                style={getGradientStyle()}>
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={4}>
                            <Group align="center" gap="xs">
                                <Title order={2}>{voting.title}</Title>
                                {user?.isCommittee && (
                                    <Tooltip label="Edit vote" position="right">
                                        <ActionIcon variant="subtle" color="info" onClick={openEditModal}>
                                            <FontAwesomeIcon icon="edit" />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Group>
                            <Text size="sm" c="dimmed">
                                {(user?.isCommitteeOrAdmin || voting.isActive) && (
                                    <>
                                        Created by <UserLink user={voting.author} /> •{" "}
                                    </>
                                )}
                                {voting.isActive ? (
                                    <DateBadge size="sm" date={voting.createdAt} staticColor />
                                ) : (
                                    <span>
                                        concluded{" "}
                                        <DateBadge
                                            size="sm"
                                            date={voting.concludedAt ?? voting.updatedAt}
                                            staticColor
                                        />
                                    </span>
                                )}
                            </Text>
                        </Stack>
                        <Group gap="xs">
                            <VotingTypeBadge type={voting.category} />
                            {voting.isSanctionVote && (
                                <Tooltip label="Sanction Vote">
                                    <Badge color="danger" variant="light">
                                        <FontAwesomeIcon icon="gavel" />
                                    </Badge>
                                </Tooltip>
                            )}
                            {!voting.isActive && (
                                <Tooltip label={voting.isPublic ? "Public Vote" : "Private Vote"}>
                                    <Badge color={voting.isPublic ? "blue" : "gray"} variant="light">
                                        <FontAwesomeIcon icon={voting.isPublic ? "eye" : "eye-slash"} />
                                    </Badge>
                                </Tooltip>
                            )}
                            {sortedGroups.map((group) => (
                                <UserGroupBadge key={group} group={group} tooltip="top" variant="light" />
                            ))}
                            <Badge color={voting.isActive ? "success" : "gray"} variant="light">
                                {voting.isActive ? "Active" : "Concluded"}
                            </Badge>
                            {voting.isSanctionVote && voting.sanctionAppliedAt && (
                                <Badge color="red" variant="light">
                                    Sanction applied
                                </Badge>
                            )}
                        </Group>
                    </Group>

                    {user?.isCommitteeOrAdmin && (
                        <Group wrap="wrap" gap="xs">
                            <VoteCountBadge
                                voteCount={voting.votes.length}
                                totalVotes={voting.requiredVotes}
                                variant="light"
                            />

                            {voting.isActive && <DueDateBadge date={voting.deadline} variant="light" />}
                            <NotVotedBadge voting={voting} user={user} variant="light" />
                        </Group>
                    )}

                    {user?.isCommitteeOrAdmin ? (
                        <>
                            <Divider />
                            {renderDescription()}
                            <Divider />
                            {voting.targetUser && (
                                <>
                                    <Stack gap="sm">
                                        <Text size="sm" c="dimmed">
                                            Target User
                                        </Text>
                                        <UserCard
                                            user={voting.targetUser}
                                            onSelect={() => handleUserCardClick(voting.targetUser!)}
                                            static
                                            fullWidth={isMobile}
                                        />
                                    </Stack>
                                </>
                            )}
                            {voting.targetTournamentName && (
                                <Text fw={700}>
                                    Target Tournament:{" "}
                                    <Anchor
                                        href={voting.targetTournamentLink}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        {voting.targetTournamentName}
                                    </Anchor>
                                </Text>
                            )}
                            {voting.attachments?.length > 0 && (
                                <Stack gap="sm">
                                    <Text size="sm" c="dimmed">
                                        Attachments
                                    </Text>
                                    <AttachmentDisplay attachments={voting.attachments} />
                                </Stack>
                            )}
                        </>
                    ) : (
                        <>
                            {voting.publicDescription && voting.publicDescription.trim().length > 0 && (
                                <>
                                    <Divider />
                                    {renderDescription()}
                                    <Divider />
                                </>
                            )}
                        </>
                    )}

                    {user?.isCommittee && sanctionState.reason === "tie" && (
                        <AlertText type="warning">
                            This sanction vote is tied. Handle the tie manually before applying a sanction.
                        </AlertText>
                    )}

                    {user?.isCommittee && (
                        <Group wrap="wrap">
                            {sanctionState.showButton && (
                                <Button
                                    variant="filled"
                                    color="danger"
                                    onClick={handleApplySanction}
                                    loading={applySanctionMutation.isPending}
                                    disabled={sanctionState.disabled}
                                    leftSection={<FontAwesomeIcon icon="gavel" />}>
                                    {sanctionState.reason === "applied" ? "Sanction Applied" : "Apply Sanction"}
                                </Button>
                            )}
                            {user?.isAdmin && sanctionState.reason === "applied" && (
                                <Button
                                    variant="outline"
                                    color="danger"
                                    onClick={handleUndoSanction}
                                    loading={undoSanctionMutation.isPending}
                                    leftSection={<FontAwesomeIcon icon="undo" />}>
                                    Undo Sanction
                                </Button>
                            )}
                            <Button
                                variant={voting.isActive ? "filled" : "outline"}
                                color="warning"
                                onClick={handleToggleStatus}
                                loading={toggleStatusMutation.isPending}
                                disabled={
                                    !voting.isActive &&
                                    (voting.isPublic ||
                                        Boolean(
                                            voting.isSanctionVote &&
                                                (voting.sanctionAppliedAt || voting.sanctionInfringementId),
                                        ))
                                }
                                leftSection={<FontAwesomeIcon icon={voting.isActive ? "lock" : "lock-open"} />}>
                                {voting.isActive ? "Conclude" : "Reopen"}
                            </Button>
                            {!voting.isActive && (
                                <Button
                                    variant="filled"
                                    color={voting.isPublic ? "gray" : "blue"}
                                    onClick={handleTogglePublic}
                                    loading={togglePublicMutation.isPending}
                                    leftSection={<FontAwesomeIcon icon={voting.isPublic ? "eye-slash" : "eye"} />}>
                                    {voting.isPublic ? "Mark as Private" : "Mark as Public"}
                                </Button>
                            )}
                            {!voting.votes.length && (
                                <Button
                                    variant="filled"
                                    color="danger"
                                    onClick={handleDelete}
                                    loading={deleteVotingMutation.isPending}
                                    leftSection={<FontAwesomeIcon icon="trash" />}>
                                    Delete
                                </Button>
                            )}
                            {user?.isAdmin && voting.isActive && voting.votes.length && (
                                <Button
                                    variant="outline"
                                    color="danger"
                                    onClick={handleClearVotes}
                                    leftSection={<FontAwesomeIcon icon="trash" />}>
                                    Clear Votes
                                </Button>
                            )}
                        </Group>
                    )}
                </Stack>
            </Card>
            {user?.isCommittee && <VotingEditModal voting={voting} opened={editModalOpened} onClose={closeEditModal} />}
        </>
    );
}
