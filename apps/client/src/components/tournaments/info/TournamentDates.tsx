import { Stack, Group, Text, ActionIcon, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { ITournament } from "@tc/types/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import dayjs from "@tc/utils/dayjs";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    tournament: ITournament;
}

export default function TournamentDates({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(
        tournament.startDate ? new Date(tournament.startDate) : null,
    );
    const [endDate, setEndDate] = useState<Date | null>(tournament.endDate ? new Date(tournament.endDate) : null);

    const editTournamentMutation = useEditTournament(tournament.id);

    const handleSaveDates = async () => {
        if (startDate && endDate) {
            await editTournamentMutation.mutateAsync({
                startDate,
                endDate,
            });
            setIsEditingDates(false);
        }
    };

    const handleCancel = () => {
        setIsEditingDates(false);
        setStartDate(tournament.startDate ? new Date(tournament.startDate) : null);
        setEndDate(tournament.endDate ? new Date(tournament.endDate) : null);
    };

    const formatDateRange = () => {
        if (!tournament.startDate && !tournament.endDate) {
            return (
                <Text c="dimmed" fs="italic">
                    No dates set
                </Text>
            );
        }

        const start = tournament.startDate ? dayjs(tournament.startDate).format("MMMM D, YYYY") : "?";
        const end = tournament.endDate ? dayjs(tournament.endDate).format("MMMM D, YYYY") : "?";

        return (
            <Text size="sm" fw={700}>
                {start} — {end}
            </Text>
        );
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
                    Start & End Dates
                </Text>
                {isEditingDates ? (
                    <ActionIcon type="button" variant="subtle" onClick={handleCancel} color="danger" title="Cancel">
                        <FontAwesomeIcon icon="xmark" />
                    </ActionIcon>
                ) : user?.isCommitteeOrAdmin ? (
                    tournament.isActive && (
                        <ActionIcon
                            type="button"
                            variant="subtle"
                            onClick={() => setIsEditingDates(true)}
                            color="info"
                            title="Edit dates">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                    )
                ) : null}
            </Group>

            {isEditingDates ? (
                <Group align="end" wrap="nowrap">
                    <DatePickerInput
                        type="range"
                        label="Date Range"
                        placeholder="Select start and end dates"
                        clearable
                        style={{ flex: 1 }}
                        value={[startDate, endDate]}
                        onChange={(value) => {
                            const [start, end] = value ?? [null, null];
                            setStartDate(start ? dayjs(start).toDate() : null);
                            setEndDate(end ? dayjs(end).toDate() : null);
                        }}
                    />
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        onClick={handleSaveDates}
                        color="success"
                        title="Save"
                        mb={4}
                        disabled={!startDate || !endDate}
                        loading={editTournamentMutation.isPending}>
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>{formatDateRange()}</Box>
            )}
        </Stack>
    );
}
