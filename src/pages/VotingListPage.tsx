// Base
import { useEffect } from "react";
import { useVotings } from "../hooks/useVotings";
import { IVoting, VotingCategory } from "../../interfaces/Voting";
import { UserGroup } from "../../interfaces/User";
import { getSavedPreference } from "../hooks/useLocalPreferences";
import { useQueryStates, parseAsString, parseAsInteger, parseAsBoolean } from "nuqs";

// Mantine
import { useDisclosure } from "@mantine/hooks";
import { Card, Stack, Group, Pagination, Text, Button, Skeleton, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Components
import VotingCreateModal from "../components/votings/VotingCreateModal";
import VotingCard from "../components/votings/VotingCard";
import VotingFilters from "../components/votings/VotingFilters";

// Atom
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";

export default function VotingListPage() {
    const [user] = useAtom(loggedInUserAtom);
    const automaticTypeFilter = getSavedPreference<boolean>("automatic_type_filter", true);

    const getTypeFilterFromUser = () => {
        if (!user?.isCommittee || !automaticTypeFilter) return "";
        if (user?.isTournamentCommittee) return "tc";
        if (user?.isContestCommittee) return "cc";
        return "";
    };

    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            title: parseAsString.withDefault(""),
            category: parseAsString.withDefault(""),
            group: parseAsString.withDefault(getTypeFilterFromUser()),
            status: parseAsString.withDefault(""),
            needsAttention: parseAsBoolean.withDefault(false),
            visibility: parseAsString.withDefault(""),
            page: parseAsInteger.withDefault(1),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        }
    );

    const [opened, { open, close }] = useDisclosure(false);

    // Create filters object for VotingFilters component
    const filters = {
        title: queryState.title,
        category: queryState.category as VotingCategory,
        assignedGroup: queryState.group as UserGroup,
        status: queryState.status,
        showNeedsAttention: queryState.needsAttention,
        visibility: queryState.visibility,
    };

    const handleFilterChange = (newFilters) => {
        // Check if any filter has changed to reset page
        const filterChanged =
            newFilters.title !== filters.title ||
            newFilters.category !== filters.category ||
            newFilters.assignedGroup !== filters.assignedGroup ||
            newFilters.status !== filters.status ||
            newFilters.showNeedsAttention !== filters.showNeedsAttention ||
            newFilters.visibility !== filters.visibility;

        setQueryState({
            title: newFilters.title,
            category: newFilters.category,
            group: newFilters.assignedGroup,
            status: newFilters.status,
            needsAttention: newFilters.showNeedsAttention,
            visibility: newFilters.visibility,
            page: filterChanged ? 1 : queryState.page,
        });
    };

    const { data, isLoading, error } = useVotings({
        title: queryState.title,
        category: queryState.category as VotingCategory,
        assignedGroup: queryState.group as UserGroup,
        status: queryState.status,
        showNeedsAttention: queryState.needsAttention,
        visibility: queryState.visibility,
        page: queryState.page,
    });

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        setQueryState({ page: newPage });
    };

    // Ensure page number is valid when data changes
    useEffect(() => {
        if (data && queryState.page > data.pages && data.pages > 0) {
            setQueryState({ page: data.pages });
        }
    }, [data, queryState.page, setQueryState]);

    const LoadingState = () => (
        <Stack gap="md">
            {[1, 2, 3].map((i) => (
                <Card key={i} shadow="sm" p="lg">
                    <Skeleton height={24} width="40%" mb="xs" />
                    <Skeleton height={16} width="20%" mb="lg" />
                    <Skeleton height={16} width="70%" />
                </Card>
            ))}
        </Stack>
    );

    const EmptyState = ({ hasError }: { hasError: boolean }) => {
        return (
            <Stack align="center" justify="center" h={200}>
                <FontAwesomeIcon icon="poll-h" size="2x" style={{ opacity: 0.5 }} />
                <Text size="lg" c="dimmed">
                    {hasError ? "Error loading votes" : "No votes found..."}
                </Text>
                <Text size="sm" c="dimmed">
                    {hasError
                        ? `Try refreshing the page`
                        : user?.isCommittee
                        ? "Try adjusting your filters or create a new vote"
                        : ""}
                </Text>
            </Stack>
        );
    };

    return (
        <Stack gap="md">
            {/* Only show filters and create button for committee members */}
            <Stack gap="md">
                <VotingFilters user={user} values={filters} onChange={handleFilterChange} />
                {user?.isCommittee && (
                    <Button
                        onClick={open}
                        leftSection={<FontAwesomeIcon icon="plus" />}
                        variant="filled"
                        color="primary"
                        fullWidth>
                        New Vote
                    </Button>
                )}
            </Stack>

            {/* Create voting modal */}
            <VotingCreateModal opened={opened} onClose={close} />

            <Divider />

            {/* Content area */}
            {isLoading ? (
                <LoadingState />
            ) : !data || data.votings.length === 0 ? (
                <EmptyState hasError={!!error} />
            ) : (
                <Stack gap="md">
                    {data.votings.map((voting: IVoting) => (
                        <VotingCard key={voting.id} voting={voting} />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {!isLoading && data && data.pages > 1 && (
                <Group justify="center" mt="xs">
                    <Pagination value={queryState.page} onChange={handlePageChange} total={data.pages} />
                </Group>
            )}
        </Stack>
    );
}
