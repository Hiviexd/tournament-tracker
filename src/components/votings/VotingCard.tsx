// Base
import moment from "moment";
import { Link } from "react-router-dom";
import { IVoting } from "../../../interfaces/Voting";

// Mantine
import { Card, Group, Title, Text, Tooltip, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// State
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

// Components
import DueDateBadge from "../../components/common/badges/DueDateBadge";
import VoteCountBadge from "../../components/common/badges/VoteCountBadge";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";
import NotVotedBadge from "../common/badges/NotVotedBadge";
import VotingTypeBadge from "../common/badges/VotingTypeBadge";

interface IPropTypes {
    voting: IVoting;
}

export default function VotingCard({ voting }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
    const sortedGroups = [...voting.assignedGroups].sort((a, b) => b.localeCompare(a));


    const getDueDateColor = (): string => {
        const deadline = moment(voting.deadline);
        const now = moment();
        if (deadline.isBefore(now)) return "danger";
        if (deadline.isBefore(now.add(24, "hours"))) return "warning";
        return "success";
    };

    return (
        <Card
            shadow="sm"
            p="lg"
            radius="md"
            className="voting-list-card"
            component={Link}
            to={`/votes/${voting._id}`}
            data-active={voting.isActive}
            style={
                voting.isActive
                    ? {
                        ["--card-status-color" as any]: `var(--mantine-color-${getDueDateColor()}-6)`,
                    }
                    : undefined
            }>
            <Group justify="space-between" mb="xs">
                <div>
                    {/* Title */}
                    <Title order={4}>{voting.title}</Title>

                    <Text size="sm" c="dimmed">
                        {/* User info */}
                        {(user?.isCommittee || voting.isActive) && voting.author && (
                            <>
                                Created by <UserLink user={voting.author} /> •{" "}
                            </>
                        )}
                        {/* Date info */}
                        {voting.isActive && (
                            <Tooltip label={moment(voting.createdAt).format("LLL")}>
                                <span>{moment(voting.createdAt).fromNow()}</span>
                            </Tooltip>
                        )}
                        {!voting.isActive && (
                            <Tooltip label={moment(voting.concludedAt ?? voting.updatedAt).format("LLL")}>
                                <span>concluded {moment(voting.concludedAt ?? voting.updatedAt).fromNow()}</span>
                            </Tooltip>
                        )}
                    </Text>
                </div>
            </Group>
            {/* Badges */}
            <Group mt="md" justify="space-between">
                <Group gap="xs">
                    {/* Voting type */}
                    <VotingTypeBadge type={voting.category} />
                    {/* Public/Private */}
                    {!voting.isActive && (
                        <Tooltip label={voting.isPublic ? "Public Vote" : "Private Vote"}>
                            <Badge color={voting.isPublic ? "blue" : "gray"} variant="light">
                                <FontAwesomeIcon icon={voting.isPublic ? "eye" : "eye-slash"} />
                            </Badge>
                        </Tooltip>
                    )}
                    {/* Groups */}
                    {sortedGroups.map((group, index) => (
                        <UserGroupBadge key={index} group={group} tooltip="top" variant="light" />
                    ))}
                    {/* Active/Concluded */}
                    <Badge color={voting.isActive ? "success" : "gray"} variant="light">
                        {voting.isActive ? "Active" : "Concluded"}
                    </Badge>
                    {/* Vote count */}
                    {(user?.isCommittee || voting.isActive) && (
                        <VoteCountBadge
                            voteCount={voting.votes.length}
                            totalVotes={voting.requiredVotes}
                            variant="light"
                        />
                    )}
                </Group>

                <Group gap="xs">
                    {/* Not voted badge */}
                    {user?.isCommittee && <NotVotedBadge voting={voting} user={user} variant="light" />}
                    {/* Due date badge */}
                    {voting.isActive && <DueDateBadge date={voting.deadline} variant="light" />}
                </Group>
            </Group>
        </Card>
    );
}
