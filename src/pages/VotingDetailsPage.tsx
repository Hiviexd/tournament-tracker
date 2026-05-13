// Base
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router";
import { useVoting } from "../hooks/useVotings";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";

// Mantine
import { Stack, Card, Skeleton, Group, Divider } from "@mantine/core";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";


// Components
import VotingEditModal from "../components/votings/VotingEditModal";
import VotingInfo from "../components/votings/VotingInfo";
import VotingForm from "../components/votings/VotingForm";
import VotingResults from "../components/votings/VotingResults";
import EmptyState from "../components/common/EmptyState";

function VotingDetailsLoadingState() {
    return (
        <Stack gap="lg">
            {/* VotingInfo Skeleton */}
            <Card shadow="sm" p="lg" radius="md">
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start">
                        <Stack gap={4}>
                            <Group align="center" gap="xs">
                                <Skeleton height={32} width={200} />
                                <Skeleton height={24} width={24} circle />
                            </Group>
                            <Skeleton height={16} width={300} />
                        </Stack>
                        <Group gap="xs">
                            <Skeleton height={24} width={80} />
                            <Skeleton height={24} width={80} />
                            <Skeleton height={24} width={80} />
                        </Group>
                    </Group>

                    <Group wrap="wrap" gap="xs">
                        <Skeleton height={24} width={120} />
                        <Skeleton height={24} width={120} />
                        <Skeleton height={24} width={120} />
                    </Group>

                    <Divider />
                    <Stack gap="xs">
                        <Skeleton height={20} width={100} />
                        <Skeleton height={100} width="100%" />
                    </Stack>
                </Stack>
            </Card>

            {/* VotingForm Skeleton */}
            <Card shadow="sm" p="lg" radius="md">
                <Stack gap="lg">
                    <Skeleton height={24} width={150} />
                    <Skeleton height={200} width="100%" />
                    <Stack gap="xs">
                        <Skeleton height={20} width={100} />
                        <Skeleton height={120} width="100%" />
                    </Stack>
                    <Group justify="flex-end">
                        <Skeleton height={36} width={120} />
                    </Group>
                </Stack>
            </Card>

            {/* VotingResults Skeleton */}
            <Card shadow="sm" p="lg" radius="md">
                <Stack gap="lg">
                    <Skeleton height={28} width={100} />
                    <Skeleton height={200} width="100%" />
                    <Divider />
                    <Group justify="space-between" align="center">
                        <Skeleton height={20} width={150} />
                        <Skeleton height={36} width={120} />
                    </Group>
                    <Stack gap="md">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} height={100} width="100%" />
                        ))}
                    </Stack>
                </Stack>
            </Card>
        </Stack>
    );
}

export default function VotingDetailsPage() {
    const { votingId } = useParams();
    const navigate = useNavigate();
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const { data: voting, isLoading } = useVoting(votingId!);
    const [editModalOpened, { close: closeEditModal }] = useDisclosure(false);

    useDocumentTitle(voting?.title ? `${voting.title} | Vote Details` : "Vote Details | Tournament Tracker");

    return (
        <>
            {isLoading ? (
                <VotingDetailsLoadingState />
            ) : voting.error ? (
                <EmptyState
                    icon="poll-h"
                    title="Vote not found..."
                    returnLink="/votes"
                    returnText="Return to votes list"
                />
            ) : (
                <Stack gap="lg">
                    <VotingInfo voting={voting} user={loggedInUser} onNavigateBack={() => navigate("/votes")} />

                    {voting.isActive && <VotingForm voting={voting} user={loggedInUser!} />}

                    {(!voting.isActive || loggedInUser?.isDev) && <VotingResults voting={voting} user={loggedInUser} />}

                    <VotingEditModal voting={voting} opened={editModalOpened} onClose={closeEditModal} />
                </Stack>
            )}
        </>
    );
}
