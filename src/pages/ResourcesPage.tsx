import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Stack, SimpleGrid, Group, Pagination, Text, Skeleton, Card, Divider, Alert } from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ResourceCategory, ResourceType, IResource } from "../../interfaces/Resource";
import { useResources } from "../hooks/useResources";
import ResourcesFilters from "../components/resources/ResourcesFilters";
import ResourcesCard from "../components/resources/ResourcesCard";
import ResourcesCreateModal from "../components/resources/ResourcesCreateModal";
import ResourcesEditModal from "../components/resources/ResourcesEditModal";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import MarkdownText from "../components/common/MarkdownText";

interface FilterValues {
    search: string;
    author: string;
    category: ResourceCategory | "";
    type: ResourceType;
}

export default function ResourcesPage() {
    const [user] = useAtom(loggedInUserAtom);
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
    const type = location.pathname.includes("/official") ? "official" : "community";

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [selectedResource, setSelectedResource] = useState<IResource | null>(null);

    const [searchInput, setSearchInput] = useState<FilterValues>({
        search: searchParams.get("search") || "",
        author: searchParams.get("author") || "",
        category: (searchParams.get("category") as ResourceCategory) || "",
        type,
    });

    const [debouncedSearch] = useDebouncedValue(searchInput.search, 400);

    const handleFilterChange = (newFilters: FilterValues) => {
        setSearchInput(newFilters);
        setPage(1);
    };

    const handleEditResource = (resource: IResource) => {
        setSelectedResource(resource);
        openEdit();
    };

    const handleCloseEdit = () => {
        closeEdit();
        setSelectedResource(null);
    };

    const { data, isLoading } = useResources({
        search: debouncedSearch,
        author: searchInput.author,
        category: searchInput.category || undefined,
        type,
        page,
    });

    // Handle URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (searchInput.author) params.set("author", searchInput.author);
        if (searchInput.category) params.set("category", searchInput.category);
        if (page > 1) params.set("page", page.toString());
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, searchInput.author, searchInput.category, page, setSearchParams]);

    const LoadingState = () => (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} padding="lg" radius="md" className="feature-card">
                    <Stack gap="md">
                        <Group>
                            <Skeleton height={24} circle />
                            <Skeleton height={24} width="60%" />
                        </Group>
                        <Skeleton height={30} />
                        <Skeleton height={20} width="40%" />
                    </Stack>
                </Card>
            ))}
        </SimpleGrid>
    );

    const EmptyState = () => (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon="book" size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                No resources found...
            </Text>
            <Text size="sm" c="dimmed">
                Try adjusting your filters
            </Text>
        </Stack>
    );

    return (
        <Stack gap="md">
            {type === "community" && (
                <Alert color="info" icon={<FontAwesomeIcon icon="circle-info" />} title="Info">
                    <MarkdownText
                        content={`If you want a resource to be added here, please contact a member of the Tournament Committee, or open [**a ticket**](/tickets/create).`}
                    />
                </Alert>
            )}
            <ResourcesFilters values={searchInput} onChange={handleFilterChange} onCreateClick={openCreate} />
            <Divider />

            {isLoading ? (
                <LoadingState />
            ) : !data || data.resources.length === 0 ? (
                <EmptyState />
            ) : (
                <Stack gap="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {data.resources.map((resource) => (
                            <ResourcesCard
                                key={resource._id}
                                resource={resource}
                                onEdit={user?.isCommittee ? handleEditResource : undefined}
                            />
                        ))}
                    </SimpleGrid>

                    {data.pagination.total > 1 && (
                        <Group justify="center" mt="xl">
                            <Pagination value={page} onChange={setPage} total={data.pagination.total} />
                        </Group>
                    )}
                </Stack>
            )}

            <ResourcesCreateModal opened={createOpened} onClose={closeCreate} defaultType={type} />

            <ResourcesEditModal
                opened={editOpened}
                onClose={handleCloseEdit}
                resource={selectedResource as IResource}
            />
        </Stack>
    );
}
