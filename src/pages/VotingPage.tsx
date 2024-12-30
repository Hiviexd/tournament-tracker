// Base
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router";
import { useVoting } from "../hooks/useVotings";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";

// Mantine
import { Stack, Text, Card, Skeleton, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Components
import VotingEditModal from "../components/votings/VotingEditModal";
import VotingInfo from "../components/votings/VotingInfo";
import VotingForm from "../components/votings/VotingForm";
import VotingResults from "../components/votings/VotingResults";

export default function VotingPage() {
    const { votingId } = useParams();
    const navigate = useNavigate();
    const [loggedInUser] = useAtom(loggedInUserAtom);
    const { data: voting, isLoading } = useVoting(votingId!);
    const [editModalOpened, { close: closeEditModal }] = useDisclosure(false);

    const LoadingState = () => (
        <Stack gap="md">
            <Card shadow="sm" p="lg" bg="primary.11">
                <Skeleton height={24} width="60%" mb="xs" />
                <Skeleton height={16} width="20%" mb="lg" />
                <Skeleton height={16} width="50%" mb="xs" />
                <Skeleton height={16} width="40%" mb="xs" />
                <Skeleton height={16} width="20%" />
            </Card>

            <Card shadow="sm" p="lg" bg="primary.11">
                <Skeleton height={24} width="20%" mb="lg" />
                <Skeleton height={16} width="15%" mb="xs" />
                <Skeleton height={16} width="15%" mb="xs" />
                <Skeleton height={16} width="15%" mb="lg" />
                <Skeleton height={24} width="40%" />

            </Card>
        </Stack>
    );

    const EmptyState = ({ hasError }: { hasError: boolean }) => {
        return (
            <Stack align="center" justify="center" h={200}>
                <FontAwesomeIcon icon="poll-h" size="2x" style={{ opacity: 0.5 }} />
                <Text size="lg" c="dimmed">
                    {hasError ? "Error loading voting" : "Voting not found"}
                </Text>

                <Button onClick={() => navigate("/votings")}>Return to votings</Button>
            </Stack>
        );
    };

    return (
        <>
            {isLoading ? (
                <LoadingState />
            ) : !voting ? (
                <EmptyState hasError={false} />
            ) : (
                <Stack gap="lg">
                    <VotingInfo
                        votingId={votingId!}
                        voting={voting}
                        user={loggedInUser}
                        onNavigateBack={() => navigate("/voting")}
                    />

                    {voting.isActive && (
                        <VotingForm votingId={votingId!} voting={voting} user={loggedInUser!} />
                    )}

                    {(!voting.isActive || loggedInUser?.isAdmin) && (
                        <VotingResults votingId={votingId!} voting={voting} user={loggedInUser} />
                    )}

                    <VotingEditModal
                        voting={voting}
                        opened={editModalOpened}
                        onClose={closeEditModal}
                    />
                </Stack>
            )}
        </>
    );
}
