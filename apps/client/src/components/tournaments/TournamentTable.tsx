import { DISCORD_SERVER_ID } from "../../constants";
import {
    Table,
    Group,
    Badge,
    Text,
    ScrollArea,
    Card,
    Tooltip,
    Checkbox,
    Button,
    Select,
    Collapse,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { ITournament, TournamentStatus } from "@tc/types/Tournament";
import UserLink from "../common/UserLink";
import GameModeIcon from "../common/GameModeIcon";
import TournamentStatusBadge from "../common/badges/TournamentStatusBadge";
import ReviewStatusBadge from "../common/badges/ReviewStatusBadge";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import TournamentTypeBadge from "../common/badges/TournamentTypeBadge";
import CopyActionIcon from "../common/buttons/CopyActionIcon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TruncatedText } from "../common/TruncatedText";
import utils, { pickStringUnion } from "@tc/utils/client";
import TournamentStatusSelect from "../common/TournamentStatusSelect";

interface TournamentTableMassEditState {
    isMassEditMode: boolean;
    selectedTournamentIds: string[];
    massStatusValue: TournamentStatus | "";
    massStateValue: "active" | "archived" | "";
    isApplyingMassStatus: boolean;
    isApplyingMassState: boolean;
}

interface TournamentTableMassEditActions {
    onToggleRowSelection: (tournamentId: string) => void;
    onToggleAllVisibleSelection: (checked: boolean) => void;
    onMassStatusChange: (status: TournamentStatus | "") => void;
    onMassStateChange: (state: "active" | "archived" | "") => void;
    onApplyMassStatus: () => void;
    onApplyMassState: () => void;
}

export interface TournamentTableMassEditProps {
    state: TournamentTableMassEditState;
    actions: TournamentTableMassEditActions;
}

interface IProps {
    tournaments: ITournament[];
    total?: number;
    currentPage?: number;
    massEdit: TournamentTableMassEditProps;
}

export default function TournamentTable({ tournaments, total, currentPage, massEdit }: IProps) {
    const {
        state: {
            isMassEditMode,
            selectedTournamentIds,
            massStatusValue,
            massStateValue,
            isApplyingMassStatus,
            isApplyingMassState,
        },
        actions: {
            onToggleRowSelection,
            onToggleAllVisibleSelection,
            onMassStatusChange,
            onMassStateChange,
            onApplyMassStatus,
            onApplyMassState,
        },
    } = massEdit;
    const [user] = useAtom(loggedInUserAtom);
    const selectedIds = new Set(selectedTournamentIds);
    const selectedCount = selectedTournamentIds.length;
    const allVisibleSelected =
        tournaments.length > 0 && tournaments.every((tournament) => selectedIds.has(tournament._id.toString()));
    const someVisibleSelected =
        tournaments.some((tournament) => selectedIds.has(tournament._id.toString())) && !allVisibleSelected;
    const canApplyStatus = selectedCount > 0 && !!massStatusValue;
    const canApplyState = selectedCount > 0 && !!massStateValue;

    const getDiscordThreadLink = (tournament: ITournament) => {
        return `https://discord.com/channels/${DISCORD_SERVER_ID}/${tournament.threadId}`;
    };

    const potentiallyNeedsReview = (tournament: ITournament) => {
        const validStatuses = ["supportRequestReceived", "screeningConcluded"];
        if (!validStatuses.includes(tournament.status) || !tournament.endDate) return false;
        return new Date(tournament.endDate) < new Date();
    };

    const needsReviewAssignment = (tournament: ITournament) => {
        return tournament.status === "reviewOngoing" && !tournament.assignedReviewers?.length;
    };

    return (
        <Card shadow="sm" p="lg" className={`tournament-table-card ${isMassEditMode ? "mass-edit-active" : ""}`}>
            <Collapse expanded={isMassEditMode}> transitionDuration={220} transitionTimingFunction="ease">
                <Group justify="space-between" align="flex-end" mb="md" wrap="wrap">
                    <Group gap="sm" align="flex-end" wrap="wrap">
                        <TournamentStatusSelect
                            value={massStatusValue}
                            onChange={(value) => onMassStatusChange(value || "")}
                            clearable={false}
                            allowDeselect={false}
                            disabled={isApplyingMassStatus}
                            placeholder="Set status"
                            label="Status"
                        />
                        <Button
                            variant="light"
                            color="primary"
                            leftSection={<FontAwesomeIcon icon="check" />}
                            disabled={!canApplyStatus}
                            loading={isApplyingMassStatus}
                            onClick={onApplyMassStatus}>
                            Apply
                        </Button>
                    </Group>

                    <Group gap="sm" align="flex-end" wrap="wrap">
                        <Select
                            value={massStateValue}
                            onChange={(value) =>
                                onMassStateChange(pickStringUnion(value ?? "", ["active", "archived"] as const) ?? "")
                            }
                            data={[
                                { value: "active", label: "Active" },
                                { value: "archived", label: "Archived" },
                            ]}
                            clearable={false}
                            allowDeselect={false}
                            placeholder="Set state"
                            disabled={isApplyingMassState}
                            w={180}
                            label="State"
                        />
                        <Button
                            variant="light"
                            color="primary"
                            leftSection={<FontAwesomeIcon icon="check" />}
                            disabled={!canApplyState}
                            loading={isApplyingMassState}
                            onClick={onApplyMassState}>
                            Apply
                        </Button>
                    </Group>
                </Group>
            </Collapse>
            <ScrollArea>
                <Table miw={{ base: 1200, md: 800 }} className="tournament-table">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th className={`mass-edit-select-col ${isMassEditMode ? "is-visible" : ""}`}>
                                <span className="mass-edit-checkbox-wrap">
                                    <Checkbox
                                        checked={allVisibleSelected}
                                        indeterminate={someVisibleSelected}
                                        onChange={(event) => onToggleAllVisibleSelection(event.currentTarget.checked)}
                                        aria-label="Select all tournaments on current page"
                                        disabled={!isMassEditMode}
                                        tabIndex={isMassEditMode ? 0 : -1}
                                    />
                                </span>
                            </Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Mode</Table.Th>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Host</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>State</Table.Th>
                            {user?.isCommittee && <Table.Th ta="center">Thread</Table.Th>}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {tournaments.map((tournament) => {
                            const isSelected = selectedIds.has(tournament._id.toString());
                            return (
                                <Table.Tr
                                    key={tournament.id}
                                    className={isMassEditMode && isSelected ? "tournament-row-selected" : undefined}>
                                    <Table.Td className={`mass-edit-select-col ${isMassEditMode ? "is-visible" : ""}`}>
                                        <span className="mass-edit-checkbox-wrap">
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => onToggleRowSelection(tournament._id.toString())}
                                                aria-label={`Select ${tournament.name}`}
                                                disabled={!isMassEditMode}
                                                tabIndex={isMassEditMode ? 0 : -1}
                                            />
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <TournamentTypeBadge type={tournament.type} />
                                    </Table.Td>

                                    <Table.Td>
                                        <GameModeIcon mode={tournament.modes} />
                                    </Table.Td>

                                    <Table.Td w={350}>
                                        <Link to={`/tournaments/${tournament._id}`}>
                                            <TruncatedText fw={500}>{tournament.name}</TruncatedText>
                                        </Link>
                                    </Table.Td>

                                    <Table.Td>
                                        {tournament.hosts.length === 1 ? (
                                            <UserLink user={tournament.hosts[0]} fw={500} displayActiveInfringement />
                                        ) : (
                                            <Group gap={4} align="center">
                                                <UserLink
                                                    user={tournament.hosts[0]}
                                                    fw={500}
                                                    displayActiveInfringement
                                                />
                                                <Tooltip label={utils.formatHostsList(tournament.hosts)}>
                                                    <Text size="xs" c="dimmed" style={{ lineHeight: "normal" }}>
                                                        +{tournament.hosts.length - 1}
                                                    </Text>
                                                </Tooltip>
                                            </Group>
                                        )}
                                    </Table.Td>

                                    <Table.Td>
                                        <Group gap="xs">
                                            <TournamentStatusBadge status={tournament.status} />
                                            {user?.isCommittee && potentiallyNeedsReview(tournament) && (
                                                <Tooltip
                                                    multiline
                                                    w={220}
                                                    ta="center"
                                                    label="Tournament ended, potentially movable to review phase">
                                                    <Badge color="yellow" variant="light">
                                                        <FontAwesomeIcon icon="exclamation-triangle" />
                                                    </Badge>
                                                </Tooltip>
                                            )}
                                            {user?.isCommittee && needsReviewAssignment(tournament) && (
                                                <Tooltip label="Needs review assignment">
                                                    <Badge color="red" variant="light" className="animation-pulse">
                                                        <FontAwesomeIcon icon="exclamation-triangle" />
                                                    </Badge>
                                                </Tooltip>
                                            )}
                                            <ReviewStatusBadge tournament={tournament} user={user} />
                                        </Group>
                                    </Table.Td>

                                    <Table.Td>
                                        <Badge color={tournament.isActive ? "success" : "gray"} variant="light">
                                            {tournament.isActive ? "Active" : "Archived"}
                                        </Badge>
                                    </Table.Td>

                                    {user?.isCommittee && (
                                        <Table.Td ta="center">
                                            {tournament.threadId ? (
                                                <CopyActionIcon
                                                    value={getDiscordThreadLink(tournament)}
                                                    tooltip="Copy Discord thread link"
                                                    size="sm"
                                                    color="primary"
                                                />
                                            ) : (
                                                "-"
                                            )}
                                        </Table.Td>
                                    )}
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
            {(isMassEditMode || total !== undefined) && (
                <Group justify="space-between" align="center" mt="md">
                    <Text
                        size="sm"
                        c="dimmed"
                        className={`mass-edit-selected-count ${isMassEditMode ? "is-visible" : ""}`}>
                        {selectedCount} selected
                    </Text>
                    {total !== undefined && (
                        <Text size="sm" c="dimmed">
                            Showing {tournaments.length} out of {total} tournaments
                            {currentPage && currentPage > 1 && ` (page ${currentPage})`}
                        </Text>
                    )}
                </Group>
            )}
        </Card>
    );
}
