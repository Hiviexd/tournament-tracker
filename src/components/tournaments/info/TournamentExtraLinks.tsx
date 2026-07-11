import { Stack, Group, Text, ActionIcon, Box, Anchor, SimpleGrid } from "@mantine/core";
import { ITournament, ITournamentExtraLink } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import utils from "../../../../utils";
import { notifications } from "@mantine/notifications";
import ExtraLinksEditor, { ExtraLinkTypeIcon } from "./ExtraLinksEditor";

interface IProps {
    tournament: ITournament;
}

export default function TournamentExtraLinks({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditing, setIsEditing] = useState(false);
    const [draftLinks, setDraftLinks] = useState<ITournamentExtraLink[]>(tournament.extraLinks ?? []);
    const editTournamentMutation = useEditTournament(tournament.id);

    const savedLinks = tournament.extraLinks ?? [];
    const canEdit = !!user?.isCommitteeOrAdmin;

    const handleCancel = () => {
        setIsEditing(false);
        setDraftLinks(savedLinks);
    };

    const handleStartEdit = () => {
        setDraftLinks(savedLinks);
        setIsEditing(true);
    };

    const handleSave = async () => {
        const error = utils.validateExtraLinks(draftLinks);
        if (error) {
            notifications.show({
                title: "Invalid links",
                message: error,
                color: "red",
            });
            return;
        }

        await editTournamentMutation.mutateAsync({ extraLinks: draftLinks });
        setIsEditing(false);
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
                    Extra Links
                </Text>
                {isEditing ? (
                    <Group gap={4}>
                        <ActionIcon variant="subtle" onClick={handleCancel} color="danger" title="Cancel">
                            <FontAwesomeIcon icon="xmark" />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            onClick={handleSave}
                            color="success"
                            title="Save"
                            loading={editTournamentMutation.isPending}>
                            <FontAwesomeIcon icon="save" />
                        </ActionIcon>
                    </Group>
                ) : (
                    canEdit && (
                        <ActionIcon variant="subtle" onClick={handleStartEdit} color="info" title="Edit extra links">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                    )
                )}
            </Group>

            {isEditing ? (
                <ExtraLinksEditor value={draftLinks} onChange={setDraftLinks} />
            ) : (
                <Box>
                    {savedLinks.length > 0 ? (
                        <SimpleGrid
                            cols={2}
                            verticalSpacing={4}
                            w="fit-content"
                            styles={{
                                root: {
                                    gridTemplateColumns: "auto auto",
                                },
                            }}>
                            {savedLinks.map((link, index) => (
                                <Group key={`${link.type}-${link.url}-${index}`} gap="xs" wrap="nowrap">
                                    <ExtraLinkTypeIcon type={link.type} />
                                    <Text size="sm" fw={500} lineClamp={1}>
                                        <Anchor href={link.url} target="_blank" rel="noopener noreferrer">
                                            {link.name}
                                        </Anchor>
                                    </Text>
                                </Group>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No extra links
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
