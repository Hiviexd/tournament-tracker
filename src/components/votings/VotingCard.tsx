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
import { IconProp } from "@fortawesome/fontawesome-svg-core";

// Components
import DueDateBadge from "../../components/common/badges/DueDateBadge";
import VoteCountBadge from "../../components/common/badges/VoteCountBadge";
import UserLink from "../common/UserLink";
import UserGroupBadge from "../common/badges/UserGroupBadge";

interface IPropTypes {
    voting: IVoting;
}

export default function VotingCard({ voting }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);
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
                    <Title order={4}>{voting.title}</Title>
                    <Text size="sm" c="dimmed">
                        Created by <UserLink user={voting.author} /> •{" "}
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
                </div>
            </Group>
            <Group mt="md" justify="space-between">
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
                    <VoteCountBadge voteCount={voting.votes.length} totalVotes={voting.requiredVotes} variant="light" />
                </Group>

                <Group gap="xs">
                    {!checkUserVoted() && (
                        <Badge color="orange" variant="light">
                            <FontAwesomeIcon icon="exclamation-triangle" /> Not voted
                        </Badge>
                    )}
                    {voting.isActive && <DueDateBadge date={voting.deadline} variant="light" />}
                </Group>
            </Group>
        </Card>
    );
}
