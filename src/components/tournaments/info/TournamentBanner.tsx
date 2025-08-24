import { Stack, Group, Text, ActionIcon, Box, TextInput, Anchor, FocusTrap } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    tournament: ITournament;
}

export default function TournamentBanner({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingBannerUrl, setIsEditingBannerUrl] = useState(false);
    const [bannerUrl, setBannerUrl] = useState(tournament.bannerUrl || "");
    const editTournamentMutation = useEditTournament(tournament._id);

    const handleBannerUrlSave = async () => {
        await editTournamentMutation.mutateAsync({ bannerUrl });
        setIsEditingBannerUrl(false);
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
                    Banner URL
                </Text>
                {isEditingBannerUrl ? (
                    <ActionIcon
                        variant="subtle"
                        onClick={() => {
                            setIsEditingBannerUrl(false);
                            setBannerUrl(tournament.bannerUrl || "");
                        }}
                        color="danger"
                        title="Cancel">
                        <FontAwesomeIcon icon="xmark" />
                    </ActionIcon>
                ) : user?.isCommittee || tournament.host._id === user?._id ? (
                    <ActionIcon
                        variant="subtle"
                        onClick={() => setIsEditingBannerUrl(true)}
                        color="info"
                        title="Edit banner URL">
                        <FontAwesomeIcon icon="pen-to-square" />
                    </ActionIcon>
                ) : null}
            </Group>

            {isEditingBannerUrl ? (
                <Group align="center" w={{ base: "100%", xs: "50%" }}>
                    <FocusTrap active={isEditingBannerUrl}>
                        <TextInput
                            value={bannerUrl}
                            onChange={(event) => setBannerUrl(event.currentTarget.value)}
                            placeholder="Enter banner URL..."
                            style={{ flex: 1 }}
                            onFocus={(event) => event.target.select()}
                        />
                    </FocusTrap>
                    <ActionIcon variant="subtle" onClick={handleBannerUrlSave} color="success" title="Save">
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>
                    {tournament.bannerUrl ? (
                        <Text size="sm" fw={500}>
                            <Anchor href={tournament.bannerUrl} target="_blank">
                                {tournament.bannerUrl}
                            </Anchor>
                        </Text>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No banner URL set
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
