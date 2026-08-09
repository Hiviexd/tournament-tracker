import { Stack, Group, Text, ActionIcon, Box, TextInput, Anchor, FocusTrap } from "@mantine/core";
import { ITournament } from "@tc/types/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import utils from "@tc/utils/client";
import { notifications } from "@mantine/notifications";
import CopyActionIcon from "../../common/buttons/CopyActionIcon";
import AlertText from "../../common/AlertText";

interface IProps {
    tournament: ITournament;
}

export default function TournamentForumUrl({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingForumUrl, setIsEditingForumUrl] = useState(false);
    const [forumUrl, setForumUrl] = useState(tournament.forumUrl || "");
    const editTournamentMutation = useEditTournament(tournament.id);

    const handleForumUrlSave = async () => {
        const trimmed = forumUrl.trim();
        if (trimmed && !utils.isOsuForumLink(trimmed)) {
            notifications.show({
                title: "Invalid URL",
                message: "Please enter a valid osu! forum URL",
                color: "red",
            });
            return;
        }

        await editTournamentMutation.mutateAsync({ forumUrl: trimmed });
        setIsEditingForumUrl(false);
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
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
                ) : user?.isCommitteeOrAdmin ? (
                    tournament.isActive && (
                        <Group gap={4}>
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setIsEditingForumUrl(true)}
                                color="info"
                                title="Edit forum URL">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                            <CopyActionIcon value={tournament.forumUrl || ""} tooltip="Copy forum URL" />
                        </Group>
                    )
                ) : null}
            </Group>

            {isEditingForumUrl ? (
                <Group align="center" w={{ base: "100%", xs: "50%" }}>
                    <FocusTrap active={isEditingForumUrl}>
                        <TextInput
                            value={forumUrl}
                            onChange={(event) => setForumUrl(event.currentTarget.value)}
                            placeholder="Enter forum URL..."
                            style={{ flex: 1 }}
                            onFocus={(event) => event.target.select()}
                        />
                    </FocusTrap>
                    <ActionIcon
                        variant="subtle"
                        onClick={handleForumUrlSave}
                        color="success"
                        title="Save"
                        loading={editTournamentMutation.isPending}>
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>
                    {tournament.forumUrl ? (
                        <Text size="sm" fw={500}>
                            <Anchor href={tournament.forumUrl} target="_blank" rel="noopener noreferrer">
                                {tournament.forumUrl}
                            </Anchor>
                        </Text>
                    ) : user?.isCommitteeOrAdmin ? (
                        <AlertText type="warning">
                            Not set! Make sure to set the osu! forum post for this tournament.
                        </AlertText>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No link set
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
