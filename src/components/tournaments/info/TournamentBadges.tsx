import { Stack, Group, Text, ActionIcon, Box, Image, Popover, Modal } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useUploadBadges } from "../../../hooks/useTournaments";
import FileUploadInput from "../../common/FileUploadInput";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import config from "../../../../config.json";
import { IAttachment } from "../../../../interfaces/Attachment";
import { useDisclosure } from "@mantine/hooks";
import TournamentAwardsManager from "./TournamentAwardsManager";
import AlertText from "../../common/AlertText";
import { useOsuUserInfo } from "../../../hooks/useUsers";
import OsuProfile from "../../previewer/OsuProfile";
import { IOsuUser } from "../../../../interfaces/OsuApi";
import { LocalBadge } from "../../../hooks/useBadgePreviewer";

interface IProps {
    tournament: ITournament;
}

interface LocalUser extends IOsuUser {
    badges?: LocalBadge[];
}

const BadgeImage = ({ badge, index }: { badge: { url: string }; index: number }) => {
    const [opened, setOpened] = useState(false);

    return (
        <Popover opened={opened} position="top" shadow="md">
            <Popover.Target>
                <Box onMouseEnter={() => setOpened(true)} onMouseLeave={() => setOpened(false)}>
                    <Image src={badge.url} alt={`Badge ${index + 1}`} w={86} h={40} radius="0" />
                </Box>
            </Popover.Target>
            <Popover.Dropdown p={0} style={{ border: "none" }}>
                <Image src={badge.url} alt={`Badge ${index + 1} (full size)`} w={172} h={80} radius="0" />
            </Popover.Dropdown>
        </Popover>
    );
};

export default function TournamentBadges({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditingBadges, setIsEditingBadges] = useState(false);
    const uploadBadgesMutation = useUploadBadges(tournament._id);
    const { files, handleFileChange, clearFiles } = useFileUpload();
    const [awardsManagerOpened, { toggle: toggleAwardsManager }] = useDisclosure(false);
    const [profilePreviewOpened, { open: openProfilePreview, close: closeProfilePreview }] = useDisclosure(false);

    // Load current user's osu info for profile preview
    const { data: osuUser, isLoading: isLoadingOsuUser } = useOsuUserInfo(
        profilePreviewOpened && user?.osuId ? user.osuId.toString() : ""
    );

    // check if none of the badges have file size 0
    const validateBadges = (badges: IAttachment[]) => {
        return badges.every((badge) => badge.url.includes(config.r2.baseUrl));
    };

    const serverUploadOptions = {
        maxFiles: 8,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/png"],
    };

    const clientAcceptedTypes = [".png"];

    const handleUploadBadges = async () => {
        try {
            await uploadBadgesMutation.mutateAsync(files);
            setIsEditingBadges(false);
            clearFiles();
        } catch (error) {
            console.error("Failed to upload badges:", error);
        }
    };

    const badges = tournament.badges || [];

    const createUserWithTournamentBadges = (osuUser: IOsuUser): LocalUser => {
        return {
            ...osuUser,
            badges: [
                ...(osuUser.badges || []),
                ...badges.map((badge, index) => ({
                    image_url: badge.url,
                    "image@2x_url": badge.url,
                    description: `${tournament.name} Winner`,
                    awarded_at: new Date(),
                    localId: `tournament-${tournament._id}-${index}`,
                })),
            ],
        } as LocalUser;
    };

    return (
        <Stack gap={5}>
            <TournamentAwardsManager
                opened={awardsManagerOpened}
                onClose={toggleAwardsManager}
                tournament={tournament}
            />

            {/* Profile Preview Modal */}
            <Modal
                opened={profilePreviewOpened}
                onClose={closeProfilePreview}
                size="xl"
                title="Profile Preview"
                styles={{
                    header: {
                        backgroundColor: "var(--mantine-color-body)",
                        borderBottom: "1px solid var(--mantine-color-gray-3)",
                    },
                    body: {
                        padding: 0,
                    },
                }}>
                {isLoadingOsuUser ? (
                    <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                        <Text>Loading profile...</Text>
                    </Box>
                ) : osuUser ? (
                    <OsuProfile user={createUserWithTournamentBadges(osuUser)} />
                ) : (
                    <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                        <Text>Failed to load profile</Text>
                    </Box>
                )}
            </Modal>

            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Badges
                </Text>
                {isEditingBadges ? (
                    <ActionIcon
                        variant="subtle"
                        onClick={() => {
                            setIsEditingBadges(false);
                            clearFiles();
                        }}
                        color="danger"
                        title="Cancel">
                        <FontAwesomeIcon icon="xmark" />
                    </ActionIcon>
                ) : user?.isCommittee ? (
                    <Group gap={4}>
                        {tournament.isActive && (
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setIsEditingBadges(true)}
                                color="info"
                                title="Upload badges">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                        )}
                        {badges.length > 0 && (
                            <>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={openProfilePreview}
                                    color="blue"
                                    title="Preview profile">
                                    <FontAwesomeIcon icon="eye" />
                                </ActionIcon>
                                {tournament.isActive && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="success"
                                        onClick={toggleAwardsManager}
                                        disabled={!validateBadges(badges)}
                                        title="Open awards manager">
                                        <FontAwesomeIcon icon="award" />
                                    </ActionIcon>
                                )}
                            </>
                        )}
                    </Group>
                ) : null}
            </Group>

            {user?.isCommittee && badges.length > 0 && !validateBadges(badges) && (
                <AlertText size="xs" type="warning" text="Badges need to be re-uploaded to enable the awards manager" />
            )}

            <Group gap="xs" align="start">
                {isEditingBadges ? (
                    <Stack gap="xs" style={{ width: "100%" }}>
                        {badges.length > 0 && (
                            <Group gap="xs">
                                {badges.map((badge, index) => (
                                    <BadgeImage key={index} badge={badge} index={index} />
                                ))}
                            </Group>
                        )}
                        <Group align="end" w={{ base: "100%", xs: "50%" }}>
                            <Box style={{ flex: 1 }}>
                                <FileUploadInput
                                    value={files}
                                    onChange={handleFileChange}
                                    label="Upload Badges"
                                    description="Badge(s) must be .png and 172x80px"
                                    placeholder="Up to 8 badges"
                                    options={serverUploadOptions}
                                    accept={clientAcceptedTypes}
                                />
                            </Box>
                            <ActionIcon
                                variant="subtle"
                                onClick={handleUploadBadges}
                                color="success"
                                title="Save"
                                mb={4}
                                loading={uploadBadgesMutation.isPending}
                                disabled={!files.length}>
                                <FontAwesomeIcon icon="save" />
                            </ActionIcon>
                        </Group>
                    </Stack>
                ) : badges.length > 0 ? (
                    <Group gap="xs">
                        {badges.map((badge, index) => (
                            <BadgeImage key={index} badge={badge} index={index} />
                        ))}
                    </Group>
                ) : (
                    <Box
                        w={86}
                        h={40}
                        style={{
                            borderRadius: "var(--mantine-radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "var(--mantine-color-primary-10)",
                        }}>
                        <Text size="xs" c="dimmed">
                            None...
                        </Text>
                    </Box>
                )}
            </Group>
        </Stack>
    );
}
