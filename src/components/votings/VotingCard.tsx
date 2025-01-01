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

interface IPropTypes {
    voting: IVoting;
}

export default function VotingCard({ voting }: IPropTypes) {
    const [user] = useAtom(loggedInUserAtom);

    const checkUserVoted = (): boolean => {
        return !!voting.votes.find((vote) => vote.author._id === user?._id);
    };

    const getVotingTypeInfo = (): { icon: IconProp; text: string } => {
        switch (voting.category) {
            case "tournament":
                return { icon: "trophy", text: "Tournament" };
            case "user":
                return { icon: "user", text: "User" };
            case "discussion":
                return { icon: "comments", text: "Discussion" };
            default:
                return { icon: "question", text: "Unknown" };
        }
    };

    const getVotingAssignedGroups = (): string => {
        return voting.assignedGroups.join("/");
    };

    return (
        <Card
            shadow="sm"
            p="lg"
            component={Link}
            to={`/votings/${voting._id}`}
            style={{
                textDecoration: "none",
                color: "inherit",
                cursor: "pointer",
                transition: "transform 0.2s ease",
                borderLeft: `4px solid ${
                    voting.isActive
                        ? "var(--mantine-color-success-6)"
                        : "var(--mantine-color-danger-6)"
                }`,
                background: `linear-gradient(90deg, var(${
                    voting.isActive ? "--mantine-color-success-6" : "--mantine-color-danger-6"
                }) -20%, var(--mantine-color-primary-11) 3%) !important`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
            }}>
            <Group justify="space-between" mb="xs">
                <div>
                    <Title order={4}>{voting.title}</Title>
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
                </div>
            </Group>
            <Group mt="md" justify="space-between">
                <Group>
                    <Tooltip label={getVotingTypeInfo().text}>
                        <Badge color="primary" variant="filled">
                            <FontAwesomeIcon icon={getVotingTypeInfo().icon} />{" "}
                            {getVotingAssignedGroups()}
                        </Badge>
                    </Tooltip>
                    <VoteCountBadge
                        voteCount={voting.votes.length}
                        totalVotes={voting.requiredVotes}
                        variant="light"
                    />
                </Group>

                <Group>
                    {!checkUserVoted() && (
                        <Badge color="gray" variant="light">
                            Not voted
                        </Badge>
                    )}
                    {voting.isActive && <DueDateBadge date={voting.deadline} variant="light" />}
                </Group>
            </Group>
        </Card>
    );
}
