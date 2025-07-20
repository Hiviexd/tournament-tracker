import { Stack, Group, Text, ActionIcon, Box, TagsInput, Badge } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    tournament: ITournament;
}

export default function TournamentTags({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [tags, setTags] = useState(tournament.tags || []);
    const editTournamentMutation = useEditTournament(tournament._id);

    const handleTagsSave = async () => {
        const lowerCaseTags = tags.map((tag) => tag.toLowerCase());
        await editTournamentMutation.mutateAsync({ tags: lowerCaseTags });
        setIsEditingTags(false);
    };

    const handleCancel = () => {
        setIsEditingTags(false);
        setTags(tournament.tags || []);
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Search Tags
                </Text>
                {isEditingTags ? (
                    <ActionIcon variant="subtle" onClick={handleCancel} color="danger" title="Cancel">
                        <FontAwesomeIcon icon="xmark" />
                    </ActionIcon>
                ) : (
                    user?.isCommittee && (
                        <ActionIcon
                            variant="subtle"
                            onClick={() => setIsEditingTags(true)}
                            color="info"
                            title="Edit tags">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                    )
                )}
            </Group>

            {isEditingTags ? (
                <Group align="end" w={{ base: "100%", xs: "70%" }}>
                    <Box style={{ flex: 1 }}>
                        <TagsInput
                            value={tags}
                            onChange={setTags}
                            placeholder="Enter tags..."
                            description="Press enter to add a tag"
                        />
                    </Box>
                    <ActionIcon
                        variant="subtle"
                        onClick={handleTagsSave}
                        color="success"
                        title="Save"
                        mb={4}
                        loading={editTournamentMutation.isPending}>
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>
                    {tournament.tags && tournament.tags.length > 0 ? (
                        <Group gap="xs">
                            {tournament.tags.map((tag, index) => (
                                <Badge key={index} variant="light" size="sm">
                                    {tag.toLowerCase()}
                                </Badge>
                            ))}
                        </Group>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No tags set
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
