import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Stack, SimpleGrid, Group, Pagination, Text, Skeleton, Card, Divider, Alert } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
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
    const type = location.pathname.includes("/official") ? "official" : "community";

    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            search: parseAsString.withDefault(""),
            author: parseAsString.withDefault(""),
            category: parseAsString.withDefault(""),
            page: parseAsInteger.withDefault(1),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        }
    );

    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [selectedResource, setSelectedResource] = useState<IResource | null>(null);

    // Create filters object for ResourcesFilters component
    const filters: FilterValues = {
        search: queryState.search,
        author: queryState.author,
        category: queryState.category as ResourceCategory | "",
        type,
    };

    // Track previous type to detect actual changes
    const prevType = useRef(type);

    // Reset pagination when type changes
    useEffect(() => {
        if (prevType.current !== type) {
            prevType.current = type;
            setQueryState({ page: 1 });
        }
    }, [type, setQueryState]);

    const handleFilterChange = (newFilters: FilterValues) => {
        // Check if any filter has changed to reset page
        const filterChanged =
            newFilters.search !== filters.search ||
            newFilters.author !== filters.author ||
            newFilters.category !== filters.category;

        setQueryState({
            search: newFilters.search,
            author: newFilters.author,
            category: newFilters.category,
            page: filterChanged ? 1 : queryState.page,
        });
    };

    const handleEditResource = (resource: IResource) => {
        setSelectedResource(resource);
        openEdit();
    };

    const handleCloseEdit = () => {
        closeEdit();
        setSelectedResource(null);
    };

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        setQueryState({ page: newPage });
    };

    const { data, isLoading } = useResources({
        search: queryState.search,
        author: queryState.author,
        category: (queryState.category as ResourceCategory) || undefined,
        type,
        page: queryState.page,
    });

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
            <ResourcesFilters values={filters} onChange={handleFilterChange} onCreateClick={openCreate} />
            <Divider />

            {isLoading ? (
                <LoadingState />
            ) : !data || data.resources.length === 0 ? (
                <EmptyState />
            ) : (
                <Stack gap="md">
                    {data.pagination.total > 1 && (
                        <Group justify="center" my="xs">
                            <Pagination
                                value={queryState.page}
                                onChange={handlePageChange}
                                total={data.pagination.total}
                            />
                        </Group>
                    )}

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
                        <Group justify="center" mt="xs">
                            <Pagination
                                value={queryState.page}
                                onChange={handlePageChange}
                                total={data.pagination.total}
                            />
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
