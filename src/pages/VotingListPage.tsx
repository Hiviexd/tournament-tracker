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
import { notifications } from "@mantine/notifications";

// Components
import VotingCreateModal from "../components/votings/VotingCreateModal";
import VotingCard from "../components/votings/VotingCard";
import VotingFilters from "../components/votings/VotingFilters";

export default function VotingListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [searchInput, setSearchInput] = useState({
        title: searchParams.get("title") || "",
        category: (searchParams.get("category") as VotingCategory) || "",
        assignedGroup: (searchParams.get("group") as UserGroup) || "",
        status: searchParams.get("status") || "",
    });
    const [opened, { open, close }] = useDisclosure(false);
    const [debouncedTitle] = useDebouncedValue(searchInput.title, 400);

    // Handle URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedTitle) params.set("title", debouncedTitle);
        if (searchInput.category) params.set("category", searchInput.category);
        if (searchInput.assignedGroup) params.set("group", searchInput.assignedGroup);
        if (searchInput.status) params.set("status", searchInput.status);
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params);
    }, [debouncedTitle, searchInput.category, searchInput.assignedGroup, searchInput.status, page, setSearchParams]);

    useEffect(() => {
        setPage(1);
    }, [debouncedTitle, searchInput.category, searchInput.assignedGroup, searchInput.status]);

    const { data, isLoading, error } = useVotings({
        title: debouncedTitle,
        category: searchInput.category,
        assignedGroup: searchInput.assignedGroup,
        status: searchInput.status,
        page,
    });

    useEffect(() => {
        if (error) {
            notifications.show({
                title: "Error",
                message: "Failed to load votings",
                color: "red",
            });
        }
    }, [error]);

    const LoadingState = () => (
        <Stack gap="md">
            {[1, 2, 3].map((i) => (
                <Card key={i} shadow="sm" p="lg" bg="primary.11">
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
                    {hasError ? "Error loading votings" : "No votings found"}
                </Text>
                <Text size="sm" c="dimmed">
                    {hasError
                        ? "Try refreshing the page"
                        : "Try adjusting your filters or create a new voting"}
                </Text>
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            {/* Filters */}
            <Stack gap="md">
                <VotingFilters values={searchInput} onChange={setSearchInput} />
                {/* Create voting button */}
                <Button
                    onClick={open}
                    leftSection={<FontAwesomeIcon icon="plus" />}
                    variant="filled"
                    color="primary"
                    fullWidth>
                    Create New Voting
                </Button>
            </Stack>

            {/* Create voting modal */}
            <VotingCreateModal opened={opened} onClose={close} />

            <Divider />

            {/* Content area */}
            {isLoading ? (
                <LoadingState />
            ) : !data || data.votings.length === 0 ? (
                <EmptyState hasError={!data} />
            ) : (
                <Stack gap="md">
                    {data.votings.map((voting: IVoting) => (
                        <VotingCard key={voting._id} voting={voting} />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {!isLoading && data && data.pages > 1 && (
                <Group justify="center" mt="xl">
                    <Pagination value={page} onChange={setPage} total={data.pages} />
                </Group>
            )}
        </Stack>
    );
}
