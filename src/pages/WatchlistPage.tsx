import { useMemo, useState } from "react";
import { Stack, Table, ScrollArea, Card, Skeleton, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryStates, parseAsString } from "nuqs";
import { useUsersWithInfringements } from "../hooks/useUsers";
import { InfringementType } from "../../interfaces/User";
import WatchlistFilters from "../components/watchlist/WatchlistFilters";
import UserLink from "../components/common/UserLink";
import InfringementCreateModal from "../components/watchlist/InfringementCreateModal";
import EmptyState from "../components/common/EmptyState";
import InfringementBadge from "../components/common/badges/InfringementBadge";
import InfringementDurationBadge from "../components/common/badges/InfringementDurationBadge";
import InfringementExpirationBadge from "../components/common/badges/InfringementExpirationBadge";

interface FilterValues {
    user: string;
    infringementType: InfringementType | "";
}

export default function WatchlistPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            user: parseAsString.withDefault(""),
            infringementType: parseAsString.withDefault(""),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        }
    );

    // Create filters object for WatchlistFilters component
    const filters: FilterValues = useMemo(
        () => ({
            user: queryState.user,
            infringementType: queryState.infringementType as InfringementType | "",
        }),
        [queryState.user, queryState.infringementType]
    );

    const handleFilterChange = (newFilters: FilterValues) => {
        setQueryState({
            user: newFilters.user,
            infringementType: newFilters.infringementType,
        });
    };

    // Create API params from filters
    const apiParams = useMemo(() => {
        const params: { userInput?: string; infringementType?: string } = {};

        if (filters.user) {
            params.userInput = filters.user;
        }

        if (filters.infringementType) {
            params.infringementType = filters.infringementType;
        }

        return Object.keys(params).length > 0 ? params : undefined;
    }, [filters]);

    const { data: users, isLoading, error } = useUsersWithInfringements(apiParams);

    // No need for frontend filtering since backend handles it
    const filteredUsers = users || [];

    const LoadingState = () => (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Active Infringement</Table.Th>
                            <Table.Th>Duration</Table.Th>
                            <Table.Th>Expiration</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Table.Tr key={i}>
                                <Table.Td>
                                    <Skeleton height={20} width={120} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={100} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={80} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={80} />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );

    return (
        <Stack gap="md">
            <WatchlistFilters values={filters} onChange={handleFilterChange} />

            <Button
                onClick={() => setIsCreateModalOpen(true)}
                leftSection={<FontAwesomeIcon icon="plus" />}
                variant="filled"
                color="primary"
                fullWidth>
                Add Infringement
            </Button>

            {isLoading ? (
                <LoadingState />
            ) : !filteredUsers || filteredUsers.length === 0 ? (
                <EmptyState
                    icon="user-shield"
                    title="No users found"
                    description={error ? "Try refreshing the page" : "Try adjusting your filters"}
                />
            ) : (
                <Card shadow="sm" p="lg">
                    <ScrollArea>
                        <Table>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>User</Table.Th>
                                    <Table.Th>Active Infringement</Table.Th>
                                    <Table.Th>Duration</Table.Th>
                                    <Table.Th>Expiration</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredUsers.map((user) => (
                                    <Table.Tr key={user.id}>
                                        <Table.Td>
                                            <UserLink user={user} />
                                        </Table.Td>
                                        <Table.Td>
                                            <InfringementBadge
                                                infringement={user.activeInfringement || user.latestAction}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <InfringementDurationBadge
                                                infringement={user.activeInfringement || user.latestAction}
                                            />
                                        </Table.Td>
                                        <Table.Td>
                                            <InfringementExpirationBadge
                                                infringement={user.activeInfringement || user.latestAction}
                                            />
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Card>
            )}

            <InfringementCreateModal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </Stack>
    );
}
