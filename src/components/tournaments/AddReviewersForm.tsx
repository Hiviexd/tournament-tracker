import { Stack, Group, Select, ActionIcon, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { ITournament } from "../../../interfaces/Tournament";
import { IUser } from "../../../interfaces/User";
import { useAddReviewer } from "../../hooks/useTournaments";
import utils from "../../../utils";

interface IProps {
    tournament: ITournament;
    committeeUsers: IUser[] | undefined;
    currentUserId?: string;
}

export default function AddReviewersForm({ tournament, committeeUsers, currentUserId }: IProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const addReviewerMutation = useAddReviewer(tournament.id);

    const currentReviewerIds = tournament.assignedReviewers?.map((r) => r.id) || [];
    const options = utils.getReviewerCommitteeOptions(tournament, committeeUsers, currentReviewerIds, currentUserId);

    const handleAddReviewer = async () => {
        if (!selectedId) return;
        await addReviewerMutation.mutateAsync(selectedId);
        setSelectedId(null);
    };

    return (
        <Stack gap={2}>
            <Text size="sm" fw={500}>
                Add reviewer
            </Text>
            <Group align="center" gap="xs" wrap="nowrap">
                <Select
                    placeholder="Select a reviewer to add"
                    data={options}
                    value={selectedId}
                    onChange={(value) => setSelectedId(value || "")}
                    allowDeselect={false}
                />
                <ActionIcon
                    variant="light"
                    color="success"
                    onClick={handleAddReviewer}
                    disabled={!selectedId}
                    loading={addReviewerMutation.isPending}>
                    <FontAwesomeIcon icon="user-plus" />
                </ActionIcon>
            </Group>
        </Stack>
    );
}
