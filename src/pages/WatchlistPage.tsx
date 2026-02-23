import { useEffect, useMemo, useState } from "react";
import {
    Stack,
    Table,
    ScrollArea,
    Card,
    Skeleton,
    Button,
    Tooltip,
    ActionIcon,
    Group,
    Badge,
    Pagination,
} from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { useWatchlist } from "../hooks/useInfringements";
import { InfringementType, IInfringement, TIME_BASED_TYPES } from "../../interfaces/Infringement";
import { IUser } from "../../interfaces/User";
import WatchlistFilters from "../components/watchlist/WatchlistFilters";
import UserDisplay from "../components/common/UserDisplay";
import InfringementCreateModal from "../components/watchlist/InfringementCreateModal";
import UserWatchlistModal from "../components/watchlist/UserWatchlistModal";
import EmptyState from "../components/common/EmptyState";
import InfringementBadge from "../components/common/badges/InfringementBadge";
import CopyActionIcon from "../components/common/buttons/CopyActionIcon";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import config from "../../config.json";
import { useSearchParams } from "react-router-dom";
import InfringementReasonHoverCard from "../components/watchlist/InfringementReasonHoverCard";

const WATCHLIST_PAGE_SIZE = 20;

interface FilterValues {
    type: InfringementType | "";
}

function isTimeBasedType(i: IInfringement): boolean {
    return (i.isTimeBased ?? TIME_BASED_TYPES.includes(i.type as InfringementType)) === true;
}

function isExpiredInfringement(i: IInfringement): boolean {
    return !!(i.endDate && new Date(i.endDate) < new Date());
}

/** Primary display priority: latest date-based ban (active over inactive), then latest warning, then latest note. */
function getPrimaryInfringement(user: IUser): IInfringement | null {
    const infringements = user?.infringements ?? [];
    if (infringements.length === 0) return null;

    const byCreatedDesc = (a: IInfringement, b: IInfringement) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);

    const bans = infringements.filter(isTimeBasedType);
    if (bans.length > 0) {
        const sortedBans = [...bans].sort((a, b) => {
            const aActive = isTimeBasedType(a) && !isExpiredInfringement(a) ? 1 : 0;
            const bActive = isTimeBasedType(b) && !isExpiredInfringement(b) ? 1 : 0;
            if (bActive !== aActive) return bActive - aActive;
            return byCreatedDesc(a, b);
        });
        return sortedBans[0];
    }

    const latestWarning = [...infringements]
        .filter((i) => i.type === InfringementType.WARNING)
        .sort(byCreatedDesc)[0];
    if (latestWarning) return latestWarning;

    const latestNote = [...infringements]
        .filter((i) => i.type === InfringementType.NOTE)
        .sort(byCreatedDesc)[0];
    return latestNote ?? null;
}

function getReasonInfringement(user: IUser): IInfringement | null {
    const primary = getPrimaryInfringement(user);
    if (primary) return primary;
    return user?.latestAction ?? null;
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

    const [queryState, setQueryState] = useQueryStates(
        {
            type: parseAsString.withDefault(""),
            page: parseAsInteger.withDefault(1),
        },
        { clearOnDefault: true }
    );

    const filters: FilterValues = useMemo(
        () => ({
            type: queryState.type as InfringementType | "",
        }),
        [queryState.type]
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
        [filters.type, queryState.page]
    );

    const { data, isLoading, error } = useWatchlist(apiParams);

    const users = data?.users ?? [];
    const totalPages = data?.pages ?? 0;

    useEffect(() => {
        if (data && queryState.page > data.pages && data.pages > 0) {
            setQueryState({ page: data.pages });
        }
    }, [data, queryState.page, setQueryState]);

    const handlePageChange = (page: number) => {
        setQueryState({ page });
    };

    const LoadingState = () => (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table miw={{ base: 800, md: 700 }}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Primary</Table.Th>
                            <Table.Th>Latest action</Table.Th>
                            <Table.Th>Reason</Table.Th>
                            <Table.Th ta="center">Enchant</Table.Th>
                            <Table.Th ta="center">Thread</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Table.Tr key={i}>
                                <Table.Td><Skeleton height={20} width={120} /></Table.Td>
                                <Table.Td><Skeleton height={20} width={100} /></Table.Td>
                                <Table.Td><Skeleton height={20} width={90} /></Table.Td>
                                <Table.Td><Skeleton height={20} width={100} /></Table.Td>
                                <Table.Td ta="center"><Skeleton height={20} width={40} /></Table.Td>
                                <Table.Td ta="center"><Skeleton height={20} width={40} /></Table.Td>
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

            <WatchlistFilters values={filters} onChange={handleFilterChange} onUserSelect={handleUserSelect as (user: IUser | null) => void} />

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
            ) : !users.length ? (
                <EmptyState
                    icon="user-shield"
                    title="No users found"
                    description={error ? "Try refreshing the page" : "Try adjusting your filters"}
                />
            ) : (
                <>
                    <Card shadow="sm" p="lg">
                        <ScrollArea>
                            <Table miw={{ base: 800, md: 700 }}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>User</Table.Th>
                                        <Table.Th>Primary</Table.Th>
                                        <Table.Th>Latest action</Table.Th>
                                        <Table.Th>Reason</Table.Th>
                                        <Table.Th ta="center">Enchant</Table.Th>
                                        <Table.Th ta="center">Thread</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {users.map((user) => {
                                        const primary = getPrimaryInfringement(user);
                                        const reasonInf = getReasonInfringement(user);
                                        const latestAction = user.latestAction;
                                        const enchantUrl = primary?.enchantUrl ?? latestAction?.enchantUrl;
                                        const threadId = primary?.threadId ?? latestAction?.threadId;
                                        return (
                                            <Table.Tr key={user.id}>
                                                <Table.Td>
                                                    <UserDisplay
                                                        user={user}
                                                        onClick={() => handleUserSelect(user)}
                                                        disablePopover
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    {primary ? (
                                                        <Group gap="xs" wrap="nowrap">
                                                            <InfringementBadge infringement={primary} size="sm" />
                                                            {primary.isTimeBased && (
                                                                <Badge
                                                                    variant="light"
                                                                    color={primary.isExpired ? "gray" : "green"}
                                                                    size="sm">
                                                                    {primary.isExpired ? "Expired" : "Active"}
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {latestAction ? (
                                                        <Group gap={4} wrap="nowrap">
                                                            <InfringementBadge infringement={latestAction} size="sm" />
                                                        </Group>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {reasonInf ? (
                                                        <InfringementReasonHoverCard infringement={reasonInf} />
                                                    ) : (
                                                        "—"
                                                    )}
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    {enchantUrl ? (
                                                        <Tooltip label="Open Enchant ticket">
                                                            <ActionIcon
                                                                variant="subtle"
                                                                onClick={() => window.open(enchantUrl, "_blank")}
                                                                color="primary"
                                                                size="md">
                                                                <FontAwesomeIcon icon="envelope" size="sm" />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    {threadId ? (
                                                        <CopyActionIcon
                                                            value={getDiscordThreadLink(threadId)}
                                                            tooltip="Copy Discord thread link"
                                                            size="md"
                                                            color="primary"
                                                        />
                                                    ) : (
                                                        "—"
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Card>
                    {totalPages > 1 && (
                        <Group justify="center">
                            <Pagination
                                value={queryState.page}
                                onChange={handlePageChange}
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
