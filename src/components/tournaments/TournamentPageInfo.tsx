import {
    Title,
    Stack,
    Group,
    Select,
    Text,
    Progress,
    Tooltip,
    ActionIcon,
    Button,
    TextInput,
    Anchor,
    Card,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { ITournament, TournamentStatus } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import TournamentStatusBadge from "./TournamentStatusBadge";
import { useEditTournament } from "../../hooks/useTournaments";
import moment from "moment";

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
    const [isEditingForumUrl, setIsEditingForumUrl] = useState(false);
    const [isEditingStartDate, setIsEditingStartDate] = useState(false);
    const [isEditingEndDate, setIsEditingEndDate] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<TournamentStatus>(tournament.status);
    const [forumUrl, setForumUrl] = useState(tournament.forumUrl || "");
    const [startDate, setStartDate] = useState<Date | null>(
        tournament.startDate ? new Date(tournament.startDate) : null
    );
    const [endDate, setEndDate] = useState<Date | null>(tournament.endDate ? new Date(tournament.endDate) : null);

    const editTournamentMutation = useEditTournament(tournament._id);

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

    const handleStatusSave = async () => {
        if (confirm("Are you sure you want to update the status? This will notify the tournament host.")) {
            await editTournamentMutation.mutateAsync({ status: selectedStatus });
            setIsEditingStatus(false);
        }
    };

    const handleForumUrlSave = async () => {
        await editTournamentMutation.mutateAsync({ forumUrl });
        setIsEditingForumUrl(false);
    };

    const handleStartDateSave = async () => {
        if (startDate) {
            await editTournamentMutation.mutateAsync({
                startDate: startDate.toISOString() as unknown as Date,
            });
            setIsEditingStartDate(false);
        }
    };

    const handleEndDateSave = async () => {
        if (endDate) {
            await editTournamentMutation.mutateAsync({
                endDate: endDate.toISOString() as unknown as Date,
            });
            setIsEditingEndDate(false);
        }
    };

    const handleToggleState = async () => {
        if (confirm(`Are you sure you want to ${tournament.isActive ? "archive" : "unarchive"} this tournament?`)) {
            await editTournamentMutation.mutateAsync({ isActive: !tournament.isActive });
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
        <Card shadow="sm" p="lg" radius="md">
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
                                            style={{ width: "20%" }}
                                        />
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={handleStatusSave}
                                                color="success"
                                                title="Save">
                                                <FontAwesomeIcon icon="save" />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={() => setIsEditingStatus(false)}
                                                color="danger"
                                                title="Cancel">
                                                <FontAwesomeIcon icon="xmark" />
                                            </ActionIcon>
                                        </Group>
                                    </>
                                ) : (
                                    <>
                                        <TournamentStatusBadge tournament={tournament} />
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => setIsEditingStatus(true)}
                                            color="info"
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

                    <Stack gap={5}>
                        <Text size="sm" fw={500}>
                            Forum URL
                        </Text>
                        <Group gap="xs" align="end">
                            {isEditingForumUrl ? (
                                <>
                                    <TextInput
                                        value={forumUrl}
                                        onChange={(event) => setForumUrl(event.currentTarget.value)}
                                        placeholder="Enter forum URL..."
                                        style={{ width: "36%", minWidth: "200px" }}
                                    />
                                    <Group gap="xs">
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={handleForumUrlSave}
                                            color="success"
                                            title="Save"
                                            disabled={!forumUrl.trim()}>
                                            <FontAwesomeIcon icon="save" />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => {
                                                setIsEditingForumUrl(false);
                                                setForumUrl(tournament.forumUrl || "");
                                            }}
                                            color="danger"
                                            title="Cancel">
                                            <FontAwesomeIcon icon="xmark" />
                                        </ActionIcon>
                                    </Group>
                                </>
                            ) : (
                                <>
                                    <Text>
                                        {tournament.forumUrl ? (
                                            <Anchor
                                                lineClamp={2}
                                                href={tournament.forumUrl}
                                                target="_blank"
                                                rel="noopener noreferrer">
                                                {tournament.forumUrl.split("/").pop()}
                                            </Anchor>
                                        ) : (
                                            <Text c="dimmed" fs="italic">
                                                No forum URL set
                                            </Text>
                                        )}
                                    </Text>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => setIsEditingForumUrl(true)}
                                        color="info"
                                        title="Update forum URL">
                                        <FontAwesomeIcon icon="pen-to-square" />
                                    </ActionIcon>
                                </>
                            )}
                        </Group>
                    </Stack>

                    <Group align="flex-start">
                        <Stack gap={5} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                Start Date
                            </Text>
                            <Group>
                                {isEditingStartDate ? (
                                    <>
                                        <DateInput
                                            value={startDate}
                                            onChange={setStartDate}
                                            placeholder="Select start date"
                                            clearable
                                            style={{ width: "60%" }}
                                        />
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={handleStartDateSave}
                                                color="success"
                                                disabled={!startDate}
                                                loading={editTournamentMutation.isPending}
                                                title="Save">
                                                <FontAwesomeIcon icon="save" />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={() => {
                                                    setIsEditingStartDate(false);
                                                    setStartDate(
                                                        tournament.startDate ? new Date(tournament.startDate) : null
                                                    );
                                                }}
                                                color="danger"
                                                title="Cancel">
                                                <FontAwesomeIcon icon="xmark" />
                                            </ActionIcon>
                                        </Group>
                                    </>
                                ) : (
                                    <>
                                        <Text size="sm">{moment(tournament.startDate).format("YYYY-MM-DD")}</Text>
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => setIsEditingStartDate(true)}
                                            color="info"
                                            title="Update start date">
                                            <FontAwesomeIcon icon="pen-to-square" />
                                        </ActionIcon>
                                    </>
                                )}
                            </Group>
                        </Stack>

                        <Stack gap={5} style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                End Date
                            </Text>
                            <Group>
                                {isEditingEndDate ? (
                                    <>
                                        <DateInput
                                            value={endDate}
                                            onChange={setEndDate}
                                            placeholder="Select end date"
                                            clearable
                                            minDate={startDate || undefined}
                                            style={{ width: "60%" }}
                                        />
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={handleEndDateSave}
                                                color="success"
                                                disabled={!endDate}
                                                loading={editTournamentMutation.isPending}
                                                title="Save">
                                                <FontAwesomeIcon icon="save" />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                onClick={() => {
                                                    setIsEditingEndDate(false);
                                                    setEndDate(
                                                        tournament.endDate ? new Date(tournament.endDate) : null
                                                    );
                                                }}
                                                color="danger"
                                                title="Cancel">
                                                <FontAwesomeIcon icon="xmark" />
                                            </ActionIcon>
                                        </Group>
                                    </>
                                ) : (
                                    <>
                                        <Text size="sm">{moment(tournament.endDate).format("YYYY-MM-DD")}</Text>
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => setIsEditingEndDate(true)}
                                            color="info"
                                            title="Update end date">
                                            <FontAwesomeIcon icon="pen-to-square" />
                                        </ActionIcon>
                                    </>
                                )}
                            </Group>
                        </Stack>
                    </Group>

                    <Group gap="xs">
                        <Button
                            variant="filled"
                            color={tournament.isActive ? "danger" : "warning"}
                            onClick={handleToggleState}
                            leftSection={<FontAwesomeIcon icon="box-archive" />}
                            loading={editTournamentMutation.isPending}>
                            {tournament.isActive ? "Archive" : "Unarchive"}
                        </Button>
                    </Group>
                </Stack>
            </Stack>
        </Card>
    );
}
