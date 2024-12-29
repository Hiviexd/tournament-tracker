import { useEffect, useState } from "react";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useSearchParams } from "react-router-dom";
import {
    Card,
    Stack,
    Group,
    TextInput,
    Select,
    Switch,
    Pagination,
    Text,
    Title,
    Button,
    Skeleton,
    Tooltip,
} from "@mantine/core";
import { useVotings } from "../hooks/useVotings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { VotingCategory } from "../../interfaces/Voting";
import { notifications } from "@mantine/notifications";
import VotingCreateModal from "../components/votings/VotingCreateModal";
import moment from "moment";

export default function VotingListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const [searchInput, setSearchInput] = useState({
        title: searchParams.get("title") || "",
        category: (searchParams.get("category") as VotingCategory) || "",
        isActive: searchParams.get("active") !== "false",
    });
    const [opened, { open, close }] = useDisclosure(false);
    const [debouncedTitle] = useDebouncedValue(searchInput.title, 300);

    // Handle URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedTitle) params.set("title", debouncedTitle);
        if (searchInput.category) params.set("category", searchInput.category);
        if (!searchInput.isActive) params.set("active", "false");
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params);
    }, [debouncedTitle, searchInput.category, searchInput.isActive, page, setSearchParams]);

    useEffect(() => {
        setPage(1);
    }, [debouncedTitle, searchInput.category, searchInput.isActive]);

    const { data, isLoading, error } = useVotings({
        title: debouncedTitle,
        category: searchInput.category,
        isActive: searchInput.isActive,
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

    const categoryOptions = [
        { value: "", label: "All Categories" },
        { value: "tournament", label: "Tournaments" },
        { value: "user", label: "Users" },
        { value: "discussion", label: "Discussions" },
    ];

    return (
        <Stack gap="md">
            {/* Filters - Always visible */}
            <Card shadow="sm" p="md" bg="primary.11">
                <Stack gap="md">
                    <Group align="flex-end">
                        <TextInput
                            placeholder="Search by title..."
                            value={searchInput.title}
                            onChange={(e) =>
                                setSearchInput((prev) => ({
                                    ...prev,
                                    title: e.currentTarget.value,
                                }))
                            }
                            style={{ flex: 1 }}
                        />
                        <Select
                            value={searchInput.category}
                            onChange={(value) =>
                                setSearchInput((prev) => ({
                                    ...prev,
                                    category: value as VotingCategory,
                                }))
                            }
                            data={categoryOptions}
                            style={{ width: 200 }}
                        />
                        <Switch
                            label="Active votes"
                            checked={searchInput.isActive}
                            onChange={(e) =>
                                setSearchInput((prev) => ({
                                    ...prev,
                                    isActive: e.currentTarget.checked,
                                }))
                            }
                            size="md"
                            my={6}
                        />
                    </Group>
                    <Button
                        onClick={open}
                        leftSection={<FontAwesomeIcon icon="plus" />}
                        variant="filled"
                        color="primary"
                        fullWidth>
                        Create New Voting
                    </Button>
                </Stack>
            </Card>

            {/* Create Voting Modal */}
            <VotingCreateModal opened={opened} onClose={close} />

            {/* Content Area */}
            {isLoading ? (
                <LoadingState />
            ) : !data || data.votings.length === 0 ? (
                <Stack align="center" justify="center" h={200}>
                    <FontAwesomeIcon icon="poll-h" size="2x" style={{ opacity: 0.5 }} />
                    <Text size="lg" c="dimmed">
                        {!data ? "Error loading votings" : "No votings found"}
                    </Text>
                    <Text size="sm" c="dimmed">
                        {!data
                            ? "Try refreshing the page"
                            : "Try adjusting your filters or create a new voting"}
                    </Text>
                </Stack>
            ) : (
                <Stack gap="md">
                    {data.votings.map((voting) => (
                        <Card key={voting._id} shadow="sm" p="lg">
                            <Group justify="space-between" mb="xs">
                                <div>
                                    <Title order={4}>{voting.title}</Title>
                                    <Text size="sm" c="dimmed">
                                        Created by {voting.author.username} •{" "}
                                        <Tooltip label={moment(voting.deadline).format("LLL")}>
                                            <span>{moment(voting.createdAt).fromNow()}</span>
                                        </Tooltip>
                                    </Text>
                                </div>
                                <Group>
                                    {voting.isActive ? (
                                        <Text c="green">Active</Text>
                                    ) : (
                                        <Text c="red">Inactive</Text>
                                    )}
                                </Group>
                            </Group>
                            <Group mt="md" justify="space-between">
                                <Text size="sm">
                                    {voting.votes.length} vote{voting.votes.length !== 1 && "s"}
                                </Text>
                                <Tooltip label={moment(voting.deadline).format("LLL")}>
                                    <Text size="sm">
                                        Deadline: {moment(voting.deadline).fromNow()}
                                    </Text>
                                </Tooltip>
                            </Group>
                        </Card>
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

// TODO: make an actual voting card component
