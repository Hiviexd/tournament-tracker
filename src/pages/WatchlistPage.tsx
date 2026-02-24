import { useEffect, useMemo, useState } from "react";
import { Stack, Button, Group, Pagination, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { useWatchlist } from "../hooks/useInfringements";
import { InfringementType } from "../../interfaces/Infringement";
import { IUser } from "../../interfaces/User";
import WatchlistFilters from "../components/watchlist/WatchlistFilters";
import UserWatchlistModal from "../components/watchlist/UserWatchlistModal";
import WatchlistTable from "../components/watchlist/WatchlistTable";
import WatchlistTableSkeleton from "../components/watchlist/WatchlistTableSkeleton";
import InfringementCreateModal from "../components/watchlist/InfringementCreateModal";
import EmptyState from "../components/common/EmptyState";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import config from "../../config.json";
import { useSearchParams } from "react-router-dom";
import { WATCHLIST_PAGE_SIZE } from "../components/watchlist/watchlistUtils";

interface FilterValues {
    type: InfringementType | "";
}

export default function WatchlistPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const setSelectedUser = useSetAtom(selectedUserAtom);
    const [searchParams, setSearchParams] = useSearchParams();

    const getDiscordThreadLink = (threadId: string) =>
        `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${threadId}`;

    const handleUserWatchlistModalClose = () => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("user");
            return next;
        });
        setSelectedUser(null);
    };

    const handleUserSelect = (user: IUser) => {
        setSelectedUser(user);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("user", user.osuId.toString());
            return next;
        });
    };

    const [queryState, setQueryState] = useQueryStates(
        {
            type: parseAsString.withDefault(""),
            page: parseAsInteger.withDefault(1),
        },
        { clearOnDefault: true },
    );

    const filters: FilterValues = useMemo(
        () => ({ type: queryState.type as InfringementType | "" }),
        [queryState.type],
    );

    const handleFilterChange = (newFilters: FilterValues) => {
        const typeChanged = newFilters.type !== filters.type;
        setQueryState({
            type: newFilters.type,
            page: typeChanged ? 1 : queryState.page,
        });
    };

    const apiParams = useMemo(
        () => ({
            infringementType: filters.type || undefined,
            page: queryState.page,
            limit: WATCHLIST_PAGE_SIZE,
        }),
        [filters.type, queryState.page],
    );

    const { data, isLoading, error } = useWatchlist(apiParams);
    const users = data?.users ?? [];
    const totalPages = data?.pages ?? 0;

    useEffect(() => {
        if (data && queryState.page > data.pages && data.pages > 0) {
            setQueryState({ page: data.pages });
        }
    }, [data, queryState.page, setQueryState]);

    return (
        <Stack gap="md">
            <UserWatchlistModal userId={searchParams.get("user")} onClose={handleUserWatchlistModalClose} />

            <WatchlistFilters
                values={filters}
                onChange={handleFilterChange}
                onUserSelect={handleUserSelect as (user: IUser | null) => void}
            />

            <Button
                onClick={() => setIsCreateModalOpen(true)}
                leftSection={<FontAwesomeIcon icon="plus" />}
                variant="filled"
                color="primary"
                fullWidth>
                Add Infringement
            </Button>

            {isLoading ? (
                <WatchlistTableSkeleton />
            ) : !users.length ? (
                <EmptyState
                    icon="user-shield"
                    title="No users found"
                    description={error ? "Try refreshing the page" : "Try adjusting your filters"}
                />
            ) : (
                <>
                    <Divider />
                    {totalPages > 1 && (
                        <Group justify="center">
                            <Pagination
                                value={queryState.page}
                                onChange={(page) => setQueryState({ page })}
                                total={totalPages}
                            />
                        </Group>
                    )}
                    <WatchlistTable
                        users={users}
                        onUserSelect={handleUserSelect}
                        getDiscordThreadLink={getDiscordThreadLink}
                    />
                    {totalPages > 1 && (
                        <Group justify="center">
                            <Pagination
                                value={queryState.page}
                                onChange={(page) => setQueryState({ page })}
                                total={totalPages}
                            />
                        </Group>
                    )}
                </>
            )}

            <InfringementCreateModal opened={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </Stack>
    );
}
