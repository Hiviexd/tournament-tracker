import { Stack, Title, Group, Text, Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import VotingCard from "../votings/VotingCard";
import { IVoting } from "../../../interfaces/Voting";
import { IUser } from "../../../interfaces/User";
import EmptyState from "../common/EmptyState";

interface IProps {
    votings: IVoting[];
    user: IUser | null;
}

export default function DashboardVotingsSection({ votings, user }: IProps) {
    const checkVotingNeedsVote = (voting: IVoting, user: IUser | null): boolean => {
        if (!voting.isActive) return false;
        if (!voting.votes || !user) return false;
        if (voting.abstainedUsers?.some((abstainedUser) => abstainedUser._id.toString() === user._id.toString()))
            return false;

        // First check if user is in any of the assigned groups
        const isInAssignedGroups = voting.assignedGroups.some((group) => {
            switch (group) {
                case "tc":
                    return user.isTournamentCommittee;
                case "cc":
                    return user.isContestCommittee;
                default:
                    return false;
            }
        });

        if (!isInAssignedGroups) return false;
        return !voting.votes.some((vote) => vote.author && vote.author._id === user._id);
    };

    // Group votings
    const votingsNeedingVote = votings.filter((voting) => checkVotingNeedsVote(voting, user));
    const otherVotings = votings.filter((voting) => !checkVotingNeedsVote(voting, user));

    return (
        <Stack gap="md">
            <Title order={3}>Votes</Title>

            {votingsNeedingVote.length > 0 || otherVotings.length > 0 ? (
                <>
                    <Stack gap="sm">
                        <Group align="center" gap="xs">
                            <Title order={4} c="orange">
                                Needs Your Vote
                            </Title>
                            <Badge color="orange" variant="light">
                                {votingsNeedingVote.length}
                            </Badge>
                        </Group>
                        {votingsNeedingVote.length > 0 ? (
                            <Stack gap="md">
                                {votingsNeedingVote.map((voting) => (
                                    <VotingCard key={voting._id} voting={voting} />
                                ))}
                            </Stack>
                        ) : (
                            <Group gap="xs" pl="md">
                                <FontAwesomeIcon icon="check-double" style={{ opacity: 0.5 }} />
                                <Text size="sm" c="dimmed">
                                    All clear!
                                </Text>
                            </Group>
                        )}
                    </Stack>

                    <Stack gap="sm">
                        <Group align="center" gap="xs">
                            <Title order={4}>Other Active Votes</Title>
                            <Badge color="gray" variant="light">
                                {otherVotings.length}
                            </Badge>
                        </Group>
                        {otherVotings.length > 0 ? (
                            <Stack gap="md">
                                {otherVotings.map((voting) => (
                                    <VotingCard key={voting._id} voting={voting} />
                                ))}
                            </Stack>
                        ) : (
                            <Group gap="xs" pl="md">
                                <FontAwesomeIcon icon="check-double" style={{ opacity: 0.5 }} />
                                <Text size="sm" c="dimmed">
                                    All clear!
                                </Text>
                            </Group>
                        )}
                    </Stack>
                </>
            ) : (
                <EmptyState
                    height={100}
                    icon="vote-yea"
                    title="All votes are clear!"
                    description="Go play some osu!, annoy Albion, or do what you do best."
                />
            )}
        </Stack>
    );
}
