import { useMemo, useState } from "react";
import { Stack, Table, ScrollArea, Card, Skeleton, Button, Tooltip, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryStates, parseAsString } from "nuqs";
import { useWatchlist } from "../hooks/useInfringements";
import { InfringementType } from "../../interfaces/Infringement";
import { IUser } from "../../interfaces/User";
import WatchlistFilters from "../components/watchlist/WatchlistFilters";
import UserDisplay from "../components/common/UserDisplay";
import InfringementCreateModal from "../components/watchlist/InfringementCreateModal";
import UserWatchlistModal from "../components/watchlist/UserWatchlistModal";
import EmptyState from "../components/common/EmptyState";
import InfringementBadge from "../components/common/badges/InfringementBadge";
import InfringementDurationBadge from "../components/common/badges/InfringementDurationBadge";
import InfringementExpirationBadge from "../components/common/badges/InfringementExpirationBadge";
import CopyActionIcon from "../components/common/buttons/CopyActionIcon";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import config from "../../config.json";
import { useSearchParams } from "react-router-dom";
import InfringementReasonHoverCard from "../components/watchlist/InfringementReasonHoverCard";

interface FilterValues {
    search: string;
    type: InfringementType | "";
}

export default function WatchlistPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const setSelectedUser = useSetAtom(selectedUserAtom);
    const [searchParams, setSearchParams] = useSearchParams();

    const getDiscordThreadLink = (threadId: string) => {
        return `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${threadId}`;
    };

    const handleUserWatchlistModalClose = () => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete("user");
            return newParams;
        });
        setSelectedUser(null);
    };

    const handleUserSelect = (user: IUser) => {
        setSelectedUser(user);
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("user", user.osuId.toString());
            return newParams;
        });
    };

    // Define query state parsers with default values
    const [queryState, setQueryState] = useQueryStates(
        {
            search: parseAsString.withDefault(""),
            type: parseAsString.withDefault(""),
        },
        {
            // Only include non-default values in URL
            clearOnDefault: true,
        }
    );

    // Create filters object for WatchlistFilters component
    const filters: FilterValues = useMemo(
        () => ({
            search: queryState.search,
            type: queryState.type as InfringementType | "",
        }),
        [queryState.search, queryState.type]
    );

    const handleFilterChange = (newFilters: FilterValues) => {
        setQueryState({
            search: newFilters.search,
            type: newFilters.type,
        });
    };

    // Create API params from filters
    const apiParams = useMemo(() => {
        const params: { userInput?: string; infringementType?: string } = {};

        if (filters.search) {
            params.userInput = filters.search;
        }

        if (filters.type) {
            params.infringementType = filters.type;
        }

        return Object.keys(params).length > 0 ? params : undefined;
    }, [filters]);

    const { data: users, isLoading, error } = useWatchlist(apiParams);

    // No need for frontend filtering since backend handles it
    const filteredUsers = users || [];

    const LoadingState = () => (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table miw={{ base: 1200, md: 800 }}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Active Infringement</Table.Th>
                            <Table.Th>Duration</Table.Th>
                            <Table.Th>Expiration</Table.Th>
                            <Table.Th ta="center">Reason</Table.Th>
                            <Table.Th ta="center">Enchant</Table.Th>
                            <Table.Th ta="center">Thread</Table.Th>
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
                                <Table.Td>
                                    <Skeleton height={20} width={100} />
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Skeleton height={20} width={40} />
                                </Table.Td>
                                <Table.Td>
                                    <Skeleton height={20} width={100} />
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Skeleton height={20} width={40} />
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Skeleton height={20} width={40} />
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
            <UserWatchlistModal userId={searchParams.get("user")} onClose={handleUserWatchlistModalClose} />

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
                        <Table miw={{ base: 1200, md: 800 }}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>User</Table.Th>
                                    <Table.Th>Active Infringement</Table.Th>
                                    <Table.Th>Duration</Table.Th>
                                    <Table.Th>Expiration</Table.Th>
                                    <Table.Th ta="center">Reason</Table.Th>
                                    <Table.Th ta="center">Enchant</Table.Th>
                                    <Table.Th ta="center">Thread</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filteredUsers.map((user) => (
                                    <Table.Tr key={user.id}>
                                        <Table.Td>
                                            <UserDisplay
                                                user={user}
                                                onClick={() => handleUserSelect(user)}
                                                disablePopover
                                            />
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
                                        <Table.Td ta="center">
                                            <InfringementReasonHoverCard
                                                infringement={user.activeInfringement || user.latestAction}
                                            />
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {user.activeInfringement?.enchantUrl || user.latestAction?.enchantUrl ? (
                                                <Tooltip label="Open Enchant ticket">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        onClick={() =>
                                                            window.open(
                                                                user.activeInfringement?.enchantUrl ||
                                                                    user.latestAction?.enchantUrl,
                                                                "_blank"
                                                            )
                                                        }
                                                        color="primary"
                                                        size="md">
                                                        <FontAwesomeIcon icon="envelope" size="sm" />
                                                    </ActionIcon>
                                                </Tooltip>
                                            ) : (
                                                "-"
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {(user.activeInfringement || user.latestAction)?.threadId ? (
                                                <CopyActionIcon
                                                    value={getDiscordThreadLink(
                                                        (user.activeInfringement || user.latestAction)?.threadId || ""
                                                    )}
                                                    tooltip="Copy Discord thread link"
                                                    size="md"
                                                    color="primary"
                                                />
                                            ) : (
                                                "-"
                                            )}
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
