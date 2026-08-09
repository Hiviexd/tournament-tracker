import { useEffect, useMemo } from "react";
import { Badge } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notifications } from "@mantine/notifications";
import { useAtom, useAtomValue } from "jotai";
import { ITournament } from "@tc/types/Tournament";
import { useBulkEditTournaments } from "./useTournaments";
import { useConfirmModal } from "./useModals";
import TournamentStatusBadge from "../components/common/badges/TournamentStatusBadge";
import MassEditConfirmContent from "../components/tournaments/mass-edit/MassEditConfirmContent";
import {
    tournamentCanUseMassEditAtom,
    tournamentMassEditActiveBulkActionAtom,
    tournamentMassEditModeAtom,
    tournamentMassEditSelectedIdsAtom,
    tournamentMassEditStateValueAtom,
    tournamentMassEditStatusValueAtom,
} from "../store/tournamentMassEditAtoms";

interface UseTournamentMassEditProps {
    tournaments: ITournament[];
}

export function useTournamentMassEdit({ tournaments }: UseTournamentMassEditProps) {
    const canUseMassEdit = useAtomValue(tournamentCanUseMassEditAtom);
    const [isMassEditMode, setIsMassEditMode] = useAtom(tournamentMassEditModeAtom);
    const [selectedTournamentIds, setSelectedTournamentIds] = useAtom(tournamentMassEditSelectedIdsAtom);
    const [massStatusValue, setMassStatusValue] = useAtom(tournamentMassEditStatusValueAtom);
    const [massStateValue, setMassStateValue] = useAtom(tournamentMassEditStateValueAtom);
    const [activeBulkAction, setActiveBulkAction] = useAtom(tournamentMassEditActiveBulkActionAtom);

    const bulkEditMutation = useBulkEditTournaments();
    const confirmModal = useConfirmModal();

    const visibleTournamentIds = useMemo(
        () => tournaments.map((tournament: ITournament) => tournament._id.toString()),
        [tournaments],
    );

    const selectedTournaments = useMemo(() => {
        const selectedIdSet = new Set(selectedTournamentIds);
        return tournaments.filter((tournament: ITournament) => selectedIdSet.has(tournament._id.toString()));
    }, [tournaments, selectedTournamentIds]);

    useEffect(() => {
        if (!canUseMassEdit && isMassEditMode) {
            setIsMassEditMode(false);
        }
    }, [canUseMassEdit, isMassEditMode, setIsMassEditMode]);

    useEffect(() => {
        setSelectedTournamentIds((currentIds) => currentIds.filter((id) => visibleTournamentIds.includes(id)));
    }, [visibleTournamentIds, setSelectedTournamentIds]);

    useEffect(() => {
        if (!isMassEditMode) {
            setSelectedTournamentIds([]);
            setMassStatusValue("");
            setMassStateValue("");
            setActiveBulkAction(null);
        }
    }, [isMassEditMode, setActiveBulkAction, setMassStateValue, setMassStatusValue, setSelectedTournamentIds]);

    const showPartialFailureNotification = (result: any) => {
        if (!result?.failureCount) return;

        const failedResults = (result.results || []).filter((item: any) => !item.success);
        const details = failedResults
            .slice(0, 3)
            .map((item: any) => `${item.name || item.tournamentId}: ${item.error || "Unknown error"}`)
            .join(" | ");

        notifications.show({
            title: "Bulk edit partially completed",
            message: details
                ? `${result.failureCount} failed. ${details}${failedResults.length > 3 ? " ..." : ""}`
                : `${result.failureCount} updates failed.`,
            color: "yellow",
        });
    };

    const toggleMassEditMode = () => {
        setIsMassEditMode((currentMode) => !currentMode);
    };

    const toggleRowSelection = (tournamentId: string) => {
        setSelectedTournamentIds((currentIds) =>
            currentIds.includes(tournamentId)
                ? currentIds.filter((id) => id !== tournamentId)
                : [...currentIds, tournamentId],
        );
    };

    const toggleAllVisibleSelection = (checked: boolean) => {
        if (checked) {
            setSelectedTournamentIds(visibleTournamentIds);
            return;
        }

        setSelectedTournamentIds([]);
    };

    const handleApplyMassStatus = async () => {
        if (!massStatusValue || selectedTournamentIds.length === 0) return;

        const statusConfirmContent = (
            <MassEditConfirmContent
                summary={
                    <>
                        This will set {selectedTournamentIds.length} tournaments to{" "}
                        <TournamentStatusBadge status={massStatusValue} />
                    </>
                }
                tournaments={selectedTournaments.map((tournament) => ({
                    id: tournament._id.toString(),
                    name: tournament.name,
                }))}
            />
        );

        const confirmed = await confirmModal({
            title: "Apply status to selected tournaments?",
            children: statusConfirmContent,
            confirmText: "Apply Status",
            confirmProps: { leftSection: <FontAwesomeIcon icon="check" /> },
        });

        if (!confirmed) return;

        try {
            setActiveBulkAction("status");
            const result = await bulkEditMutation.mutateAsync({
                tournamentIds: selectedTournamentIds,
                status: massStatusValue,
            });
            showPartialFailureNotification(result);
            setSelectedTournamentIds([]);
            setMassStatusValue("");
        } finally {
            setActiveBulkAction(null);
        }
    };

    const handleApplyMassState = async () => {
        if (!massStateValue || selectedTournamentIds.length === 0) return;

        const isActive = massStateValue === "active";
        const stateConfirmContent = (
            <MassEditConfirmContent
                summary={
                    <>
                        This will mark {selectedTournamentIds.length} tournaments as{" "}
                        <Badge color={isActive ? "success" : "gray"} variant="light">
                            {isActive ? "Active" : "Archived"}
                        </Badge>
                    </>
                }
                tournaments={selectedTournaments.map((tournament) => ({
                    id: tournament._id.toString(),
                    name: tournament.name,
                }))}
            />
        );

        const confirmed = await confirmModal({
            title: "Apply state to selected tournaments?",
            children: stateConfirmContent,
            confirmText: "Apply State",
            confirmProps: { leftSection: <FontAwesomeIcon icon="check" /> },
        });

        if (!confirmed) return;

        try {
            setActiveBulkAction("state");
            const result = await bulkEditMutation.mutateAsync({
                tournamentIds: selectedTournamentIds,
                isActive,
            });
            showPartialFailureNotification(result);
            setSelectedTournamentIds([]);
            setMassStateValue("");
        } finally {
            setActiveBulkAction(null);
        }
    };

    return {
        canUseMassEdit,
        isMassEditMode: canUseMassEdit && isMassEditMode,
        massEditModeToggleState: isMassEditMode,
        toggleMassEditMode,
        selectedCount: selectedTournamentIds.length,
        tableMassEdit: {
            state: {
                isMassEditMode: canUseMassEdit && isMassEditMode,
                selectedTournamentIds,
                massStatusValue,
                massStateValue,
                isApplyingMassStatus: bulkEditMutation.isPending && activeBulkAction === "status",
                isApplyingMassState: bulkEditMutation.isPending && activeBulkAction === "state",
            },
            actions: {
                onToggleRowSelection: toggleRowSelection,
                onToggleAllVisibleSelection: toggleAllVisibleSelection,
                onMassStatusChange: setMassStatusValue,
                onMassStateChange: setMassStateValue,
                onApplyMassStatus: handleApplyMassStatus,
                onApplyMassState: handleApplyMassState,
            },
        },
    };
}
