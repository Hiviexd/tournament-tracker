import { Stack, Group, Text, ActionIcon, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import moment from "moment";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    tournament: ITournament;
}

export default function TournamentDates({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(
        tournament.startDate ? new Date(tournament.startDate) : null
    );
    const [endDate, setEndDate] = useState<Date | null>(tournament.endDate ? new Date(tournament.endDate) : null);

    const editTournamentMutation = useEditTournament(tournament._id);

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

        const start = tournament.startDate ? moment(tournament.startDate).format("MMMM D, YYYY") : "?";
        const end = tournament.endDate ? moment(tournament.endDate).format("MMMM D, YYYY") : "?";

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
                    <ActionIcon variant="subtle" onClick={handleCancel} color="danger" title="Cancel">
                        <FontAwesomeIcon icon="xmark" />
                    </ActionIcon>
                ) : user?.isCommittee ? (
                    tournament.isActive && (
                        <ActionIcon
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
                <Stack gap="xs">
                    <Group align="end">
                        <DateInput
                            label="Start Date"
                            value={startDate}
                            onChange={(value) => setStartDate(value ? new Date(value) : null)}
                            placeholder="Select start date..."
                            clearable
                        />
                        <DateInput
                            label="End Date"
                            value={endDate}
                            onChange={(value) => setEndDate(value ? new Date(value) : null)}
                            placeholder="Select end date..."
                            clearable
                            minDate={startDate || undefined}
                        />
                        <ActionIcon
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
                </Stack>
            ) : (
                <Box>{formatDateRange()}</Box>
            )}
        </Stack>
    );
}
