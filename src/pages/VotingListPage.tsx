// Base
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useVotings } from "../hooks/useVotings";
import { IVoting, VotingCategory } from "../../interfaces/Voting";
import { UserGroup } from "../../interfaces/User";

// Mantine
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
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
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [searchInput, setSearchInput] = useState({
        title: searchParams.get("title") || "",
        category: (searchParams.get("category") as VotingCategory) || "",
        assignedGroup: (searchParams.get("group") as UserGroup) || "",
        status: searchParams.get("status") || "",
        showNeedsAttention: searchParams.get("needsAttention") === "true",
        visibility: searchParams.get("visibility") || "",
    });
    const [opened, { open, close }] = useDisclosure(false);
    const [debouncedTitle] = useDebouncedValue(searchInput.title, 400);

    const [user] = useAtom(loggedInUserAtom);

    const handleFilterChange = (newFilters) => {
        setSearchInput(newFilters);
        setPage(1);
    };

    const { data, isLoading, error } = useVotings({
        title: debouncedTitle,
        category: searchInput.category,
        assignedGroup: searchInput.assignedGroup,
        status: searchInput.status,
        showNeedsAttention: searchInput.showNeedsAttention,
        visibility: searchInput.visibility,
        page,
    });

    // Ensure page number is valid when data changes
    useEffect(() => {
        if (data && page > data.pages && data.pages > 0) {
            setPage(data.pages);
        }
    }, [data, page]);

    // Handle URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedTitle) params.set("title", debouncedTitle);
        if (searchInput.category) params.set("category", searchInput.category);
        if (searchInput.assignedGroup) params.set("group", searchInput.assignedGroup);
        if (searchInput.status) params.set("status", searchInput.status);
        if (searchInput.showNeedsAttention) params.set("needsAttention", "true");
        if (searchInput.visibility) params.set("visibility", searchInput.visibility);
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params, { replace: true });
    }, [
        debouncedTitle,
        searchInput.category,
        searchInput.assignedGroup,
        searchInput.status,
        searchInput.showNeedsAttention,
        searchInput.visibility,
        page,
        setSearchParams,
    ]);

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
                <VotingFilters user={user} values={searchInput} onChange={handleFilterChange} />
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
                        <VotingCard key={voting._id} voting={voting} />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {!isLoading && data && data.pages > 1 && (
                <Group justify="center" mt="xs">
                    <Pagination value={page} onChange={setPage} total={data.pages} />
                </Group>
            )}
        </Stack>
    );
}
