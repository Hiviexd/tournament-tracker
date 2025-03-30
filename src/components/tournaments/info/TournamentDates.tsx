import { Stack, Group, Text, ActionIcon, Box } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import moment from "moment";

interface IProps {
    tournament: ITournament;
}

export default function TournamentDates({ tournament }: IProps) {
    const [isEditingDates, setIsEditingDates] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(
        tournament.startDate ? new Date(tournament.startDate) : null
    );
    const [endDate, setEndDate] = useState<Date | null>(tournament.endDate ? new Date(tournament.endDate) : null);

    const editTournamentMutation = useEditTournament(tournament._id);

    const handleStartDateSave = async () => {
        if (startDate) {
            await editTournamentMutation.mutateAsync({
                startDate: startDate.toISOString() as unknown as Date,
            });
            setIsEditingDates(false);
        }
    };

    const handleEndDateSave = async () => {
        if (endDate) {
            await editTournamentMutation.mutateAsync({
                endDate: endDate.toISOString() as unknown as Date,
            });
            setIsEditingDates(false);
        }
    };

    return (
        <Group grow>
            <Stack gap={5}>
                <Text size="sm" fw={500}>
                    Start Date
                </Text>
                <Group gap="xs" align="end">
                    {isEditingDates ? (
                        <>
                            <DateInput
                                value={startDate}
                                onChange={setStartDate}
                                placeholder="Select start date..."
                                clearable
                            />
                            <Group gap="xs">
                                <ActionIcon
                                    variant="subtle"
                                    onClick={handleStartDateSave}
                                    color="success"
                                    title="Save"
                                    disabled={!startDate}>
                                    <FontAwesomeIcon icon="save" />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => {
                                        setIsEditingDates(false);
                                        setStartDate(tournament.startDate ? new Date(tournament.startDate) : null);
                                    }}
                                    color="danger"
                                    title="Cancel">
                                    <FontAwesomeIcon icon="xmark" />
                                </ActionIcon>
                            </Group>
                        </>
                    ) : (
                        <>
                            <Box>
                                {tournament.startDate ? (
                                    <Text>{moment(tournament.startDate).format("MMMM D, YYYY")}</Text>
                                ) : (
                                    <Text c="dimmed" fs="italic">
                                        No start date set
                                    </Text>
                                )}
                            </Box>
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setIsEditingDates(true)}
                                color="info"
                                title="Edit start date">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                        </>
                    )}
                </Group>
            </Stack>

            <Stack gap={5}>
                <Text size="sm" fw={500}>
                    End Date
                </Text>
                <Group gap="xs" align="end">
                    {isEditingDates ? (
                        <>
                            <DateInput
                                value={endDate}
                                onChange={setEndDate}
                                placeholder="Select end date..."
                                clearable
                                minDate={startDate || undefined}
                            />
                            <Group gap="xs">
                                <ActionIcon
                                    variant="subtle"
                                    onClick={handleEndDateSave}
                                    color="success"
                                    title="Save"
                                    disabled={!endDate}>
                                    <FontAwesomeIcon icon="save" />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => {
                                        setIsEditingDates(false);
                                        setEndDate(tournament.endDate ? new Date(tournament.endDate) : null);
                                    }}
                                    color="danger"
                                    title="Cancel">
                                    <FontAwesomeIcon icon="xmark" />
                                </ActionIcon>
                            </Group>
                        </>
                    ) : (
                        <>
                            <Box>
                                {tournament.endDate ? (
                                    <Text>{moment(tournament.endDate).format("MMMM D, YYYY")}</Text>
                                ) : (
                                    <Text c="dimmed" fs="italic">
                                        No end date set
                                    </Text>
                                )}
                            </Box>
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setIsEditingDates(true)}
                                color="info"
                                title="Edit end date">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                        </>
                    )}
                </Group>
            </Stack>
        </Group>
    );
}
