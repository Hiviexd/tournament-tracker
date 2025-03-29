import { Paper, Title, Stack, Group, Select, Text, Progress, Tooltip, ActionIcon, Button } from "@mantine/core";
import { ITournament, TournamentStatus } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import TournamentStatusBadge from "./TournamentStatusBadge";
import UserDisplay from "@components/common/UserDisplay";

interface IProps {
    tournament: ITournament;
}

const STATUS_PROGRESSION: { [key in TournamentStatus]: { step: number; color: string } } = {
    supportRequestReceived: { step: 1, color: "violet" },
    screeningOngoing: { step: 2, color: "indigo" },
    screeningConcluded: { step: 3, color: "info" },
    reviewOngoing: { step: 4, color: "yellow" },
    changesRequested: { step: 5, color: "orange" },
    badgeApproved: { step: 6, color: "success" },
    badgeRejected: { step: 6, color: "danger" },
    noBadgeRequested: { step: 6, color: "gray" },
};

export default function TournamentPageInfo({ tournament }: IProps) {
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<TournamentStatus>(tournament.status);

    const statusOptions = [
        { value: "supportRequestReceived", label: "Support Request Received" },
        { value: "screeningOngoing", label: "Screening Ongoing" },
        { value: "screeningConcluded", label: "Screening Concluded" },
        { value: "reviewOngoing", label: "Review Ongoing" },
        { value: "changesRequested", label: "Changes Requested" },
        { value: "badgeApproved", label: "Badge Approved" },
        { value: "badgeRejected", label: "Badge Rejected" },
        { value: "noBadgeRequested", label: "No Badge Requested" },
    ];

    // TODO: Implement status update mutation
    const handleStatusSave = () => {
        console.log("Update status to:", selectedStatus);
        setIsEditingStatus(false);
    };

    // TODO: Implement date update mutations
    const handleStartDateUpdate = () => {
        console.log("Update start date");
    };

    const handleEndDateUpdate = () => {
        console.log("Update end date");
    };

    // TODO: Implement assign reviewers mutation
    const handleAssignReviewers = () => {
        console.log("Assign reviewers");
    };

    // TODO: Implement tournament state toggle mutation
    const handleToggleState = () => {
        console.log("Tournament:", tournament.assignedReviewers);
        console.log("Toggle tournament state from", tournament.isActive, "to", !tournament.isActive);
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
        <Paper radius="md" p="lg">
            <Stack gap="lg">
                <Title order={3}>Tournament Information</Title>

                <Stack gap="md">
                    <Group align="flex-start">
                        <Stack gap={5} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                Status
                            </Text>
                            <Group gap="xs">
                                {isEditingStatus ? (
                                    <>
                                        <Select
                                            value={selectedStatus}
                                            onChange={(value) => setSelectedStatus(value as TournamentStatus)}
                                            data={statusOptions}
                                            allowDeselect={false}
                                            style={{ width: "15em" }}
                                        />
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={handleStatusSave}
                                            color="blue"
                                            title="Save">
                                            <FontAwesomeIcon icon="save" />
                                        </ActionIcon>
                                    </>
                                ) : (
                                    <>
                                        <TournamentStatusBadge tournament={tournament} />
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => setIsEditingStatus(true)}
                                            color="blue"
                                            title="Update status">
                                            <FontAwesomeIcon icon="pen-to-square" />
                                        </ActionIcon>
                                    </>
                                )}
                            </Group>
                            <Tooltip label={`Status: ${tournament.statusString}`}>
                                <Progress
                                    value={progressInfo.progress}
                                    color={progressInfo.color}
                                    size="md"
                                    radius="xl"
                                    striped
                                    my="sm"
                                    animated={
                                        tournament.status !== "badgeApproved" &&
                                        tournament.status !== "badgeRejected" &&
                                        tournament.status !== "noBadgeRequested"
                                    }
                                />
                            </Tooltip>
                        </Stack>
                    </Group>

                    <Group align="flex-start">
                        <Stack gap={5} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                Start Date
                            </Text>
                            <Group>
                                <Text>{tournament.startDate?.toLocaleString()}</Text>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={handleStartDateUpdate}
                                    color="blue"
                                    title="Update start date">
                                    <FontAwesomeIcon icon="pen-to-square" />
                                </ActionIcon>
                            </Group>
                        </Stack>

                        <Stack gap={5} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                End Date
                            </Text>
                            <Group>
                                <Text>{tournament.endDate?.toLocaleString()}</Text>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={handleEndDateUpdate}
                                    color="blue"
                                    title="Update end date">
                                    <FontAwesomeIcon icon="pen-to-square" />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </Group>

                    {tournament.assignedReviewers && tournament.assignedReviewers?.length && (
                        <Stack gap="md">
                            <Text size="sm" fw={500}>
                                Assigned Reviewers
                            </Text>
                            <Group gap="xl">
                                {tournament.assignedReviewers.map((reviewer) => (
                                    <UserDisplay user={reviewer} />
                                ))}
                            </Group>
                        </Stack>
                    )}
                    <Stack gap={5}>
                        <Text size="sm" fw={500}>
                            Actions
                        </Text>
                        <Group>
                            {tournament.status === "reviewOngoing" && !tournament.assignedReviewers?.length && (
                                <Button
                                    variant="filled"
                                    color="info"
                                    onClick={handleAssignReviewers}
                                    leftSection={<FontAwesomeIcon icon="user-group" />}>
                                    Assign Reviewers
                                </Button>
                            )}
                            <Button
                                variant="filled"
                                color={tournament.isActive ? "danger" : "warning"}
                                onClick={handleToggleState}
                                leftSection={<FontAwesomeIcon icon="box-archive" />}>
                                {tournament.isActive ? "Archive" : "Unarchive"}
                            </Button>
                        </Group>
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    );
}
