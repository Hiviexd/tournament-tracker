import { Stack, Group, Text, Progress, Tooltip, ActionIcon } from "@mantine/core";
import { ITournament, TournamentStatus as TournamentStatusType } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import TournamentStatusBadge from "../../common/badges/TournamentStatusBadge";
import TournamentStatusSelect from "../../common/TournamentStatusSelect";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import { useConfirmModal } from "../../../hooks/useModals";
import AlertText from "../../common/AlertText";

interface IProps {
    tournament: ITournament;
}

const STATUS_PROGRESSION: { [key in TournamentStatusType]: { step: number; color: string } } = {
    supportRequestReceived: { step: 1, color: "violet" },
    screeningConcluded: { step: 2, color: "info" },
    reviewOngoing: { step: 3, color: "yellow" },
    onHold: { step: 4, color: "pink" },
    changesRequested: { step: 5, color: "orange" },
    badgeApproved: { step: 6, color: "success" },
    badgeRejected: { step: 6, color: "danger" },
    noBadgeRequested: { step: 6, color: "gray" },
};

export default function TournamentStatus({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<TournamentStatusType>(tournament.status);
    const editTournamentMutation = useEditTournament(tournament._id);
    const confirmModal = useConfirmModal();

    const excludedStatusesOsu = ["supportRequestReceived", "screeningConcluded", "onHold"];

    const handleStatusSave = async () => {
        const notificationNotSending =
            excludedStatusesOsu.includes(selectedStatus) ||
            (selectedStatus === "reviewOngoing" && tournament.status === "onHold");

        const message = (
            <>
                <Text size="sm" mb="sm">
                    Are you sure you want to update the {tournament.type}'s status to{" "}
                    <TournamentStatusBadge status={selectedStatus} /> ?
                </Text>
                {notificationNotSending ? (
                    <AlertText text="This will not notify the host." type="info" />
                ) : (
                    <AlertText text="This will notify the tournament host via an osu! message." type="warning" />
                )}
            </>
        );

        if (
            await confirmModal({
                title: "Update Status?",
                children: message,
                confirmText: "Update Status",
                confirmProps: { leftSection: <FontAwesomeIcon icon="floppy-disk" /> },
            })
        ) {
            await editTournamentMutation.mutateAsync({ status: selectedStatus });
            setIsEditingStatus(false);
        }
    };

    const getProgressInfo = () => {
        const currentStatus = STATUS_PROGRESSION[tournament.status];
        const totalSteps = 6;
        const progress = (currentStatus.step / totalSteps) * 100;

        return {
            progress,
            color: currentStatus.color,
        };
    };

    const progressInfo = getProgressInfo();

    return (
        <Group align="flex-start">
            <Stack gap={5} style={{ flex: 1 }}>
                <Group gap="xs" align="center">
                    <Text size="sm" fw={500} className="header-border-left">
                        Status
                    </Text>
                    {isEditingStatus ? (
                        <ActionIcon
                            variant="subtle"
                            onClick={() => setIsEditingStatus(false)}
                            color="danger"
                            title="Cancel">
                            <FontAwesomeIcon icon="xmark" />
                        </ActionIcon>
                    ) : user?.isCommitteeOrAdmin ? (
                        tournament.isActive && (
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setIsEditingStatus(true)}
                                color="info"
                                title="Update status">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                        )
                    ) : null}
                </Group>

                {isEditingStatus ? (
                    <Group gap="xs" w={{ base: "100%", xs: "50%" }}>
                        <TournamentStatusSelect
                            value={selectedStatus}
                            onChange={(value) => setSelectedStatus(value as TournamentStatusType)}
                            allowDeselect={false}
                            clearable={false}
                            searchable={true}
                        />
                        <ActionIcon variant="subtle" onClick={handleStatusSave} color="success" title="Save">
                            <FontAwesomeIcon icon="save" />
                        </ActionIcon>
                    </Group>
                ) : (
                    <TournamentStatusBadge status={tournament.status} />
                )}

                <Tooltip label={`Status: ${tournament.statusString}`}>
                    <Progress value={progressInfo.progress} color={progressInfo.color} size="md" radius="xl" my="sm" />
                </Tooltip>
            </Stack>
        </Group>
    );
}
