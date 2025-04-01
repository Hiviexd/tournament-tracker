import { Stack, Group, Text, ActionIcon, Box, TextInput, Anchor } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import helpers from "../../../helpers";
import { notifications } from "@mantine/notifications";

interface IProps {
    tournament: ITournament;
}

export default function TournamentForumUrl({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingForumUrl, setIsEditingForumUrl] = useState(false);
    const [forumUrl, setForumUrl] = useState(tournament.forumUrl || "");
    const editTournamentMutation = useEditTournament(tournament._id);

    const handleForumUrlSave = async () => {
        if (!helpers.isOsuForumLink(forumUrl)) {
            notifications.show({
                title: "Invalid URL",
                message: "Please enter a valid osu! forum URL",
                color: "red",
            });
            return;
        }

        await editTournamentMutation.mutateAsync({ forumUrl });
        setIsEditingForumUrl(false);
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Forum Link
                </Text>
                {isEditingForumUrl ? (
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
                ) : user?.isCommittee ? (
                    tournament.isActive && (
                        <ActionIcon
                            variant="subtle"
                            onClick={() => setIsEditingForumUrl(true)}
                            color="info"
                            title="Edit forum URL">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                    )
                ) : null}
            </Group>

            {isEditingForumUrl ? (
                <Group align="center" w={{ base: "100%", xs: "50%" }}>
                    <TextInput
                        value={forumUrl}
                        onChange={(event) => setForumUrl(event.currentTarget.value)}
                        placeholder="Enter forum URL..."
                        style={{ flex: 1 }}
                    />
                    <ActionIcon
                        variant="subtle"
                        onClick={handleForumUrlSave}
                        color="success"
                        title="Save"
                        disabled={!forumUrl.trim()}>
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>
                    {tournament.forumUrl ? (
                        <Text size="sm" fw={500}>
                            <Anchor href={tournament.forumUrl} target="_blank">
                                {tournament.forumUrl}
                            </Anchor>
                        </Text>
                    ) : (
                        <Text c="dimmed" fs="italic">
                            No forum URL set
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
