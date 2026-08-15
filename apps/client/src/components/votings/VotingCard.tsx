// Base
import dayjs from "@tc/utils/dayjs";
import { Link } from "react-router-dom";
import { IVoting } from "@tc/types/Voting";

// Mantine
import { Card, Group, Title, Text, Tooltip, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// State
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

// Components
import DueDateBadge from "../../components/common/badges/DueDateBadge";
import { cssVars } from "../../themes/cssVars";
import DateBadge from "../../components/common/badges/DateBadge";
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
    const sortedGroups = voting.assignedGroups.toSorted((a, b) => b.localeCompare(a));

    const getDueDateColor = (): string => {
        const deadline = dayjs(voting.deadline);
        const now = dayjs();
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
                    ? cssVars({
                          "--card-status-color": `var(--mantine-color-${getDueDateColor()}-6)`,
                      })
                    : undefined
            }>
            <Group justify="space-between" mb="xs">
                <div>
                    {/* Title */}
                    <Title order={4}>{voting.title}</Title>

                    <Text size="sm" c="dimmed">
                        {/* User info */}
                        {(user?.isCommitteeOrAdmin || voting.isActive) && voting.author && (
                            <>
                                Created by <UserLink user={voting.author} /> •{" "}
                            </>
                        )}
                        {/* Date info */}
                        {voting.isActive ? (
                            <DateBadge size="xs" date={voting.createdAt} staticColor />
                        ) : (
                            <span>
                                concluded{" "}
                                <DateBadge size="xs" date={voting.concludedAt ?? voting.updatedAt} staticColor />
                            </span>
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
                    {sortedGroups.map((group) => (
                        <UserGroupBadge key={group} group={group} tooltip="top" variant="light" />
                    ))}
                    {/* Active/Concluded */}
                    <Badge color={voting.isActive ? "success" : "gray"} variant="light">
                        {voting.isActive ? "Active" : "Concluded"}
                    </Badge>
                    {/* Vote count */}
                    {(user?.isCommitteeOrAdmin || voting.isActive) && (
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
