import { Stack, Group, Text, ActionIcon, Box, TextInput, Anchor, FocusTrap } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import utils from "../../../../utils";
import { notifications } from "@mantine/notifications";
import CopyActionIcon from "../../common/buttons/CopyActionIcon";

interface IProps {
    tournament: ITournament;
}

export default function TournamentEnchantUrl({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingEnchantUrl, setIsEditingEnchantUrl] = useState(false);
    const [enchantUrl, setEnchantUrl] = useState(tournament.enchantUrl || "");
    const editTournamentMutation = useEditTournament(tournament.id);

    const handleEnchantUrlSave = async () => {
        if (!utils.isEnchantTicketLink(enchantUrl)) {
            notifications.show({
                title: "Invalid URL",
                message: "Please enter a valid Enchant ticket URL",
                color: "red",
            });
            return;
        }

        await editTournamentMutation.mutateAsync({ enchantUrl });
        setIsEditingEnchantUrl(false);
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
                    Enchant Ticket
                </Text>
                {isEditingEnchantUrl ? (
                    <ActionIcon
                        variant="subtle"
                        onClick={() => {
                            setIsEditingEnchantUrl(false);
                            setEnchantUrl(tournament.enchantUrl || "");
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
                                onClick={() => setIsEditingEnchantUrl(true)}
                                color="info"
                                title="Edit Enchant ticket URL">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                            <CopyActionIcon value={tournament.enchantUrl || ""} tooltip="Copy Enchant ticket URL" />
                        </Group>
                    )
                ) : null}
            </Group>

            {isEditingEnchantUrl ? (
                <Group align="center" w={{ base: "100%", xs: "50%" }}>
                    <FocusTrap active={isEditingEnchantUrl}>
                        <TextInput
                            value={enchantUrl}
                            onChange={(event) => setEnchantUrl(event.currentTarget.value)}
                            placeholder="Enter Enchant ticket URL..."
                            style={{ flex: 1 }}
                            onFocus={(event) => event.target.select()}
                        />
                    </FocusTrap>
                    <ActionIcon
                        variant="subtle"
                        onClick={handleEnchantUrlSave}
                        color="success"
                        title="Save"
                        disabled={!enchantUrl.trim()}>
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>
                    {tournament.enchantUrl ? (
                        <Text size="sm" fw={500}>
                            <Anchor href={tournament.enchantUrl} target="_blank">
                                {tournament.enchantUrl}
                            </Anchor>
                        </Text>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No Enchant URL set
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
