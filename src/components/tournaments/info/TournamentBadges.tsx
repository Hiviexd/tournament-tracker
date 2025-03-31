import { Stack, Group, Text, ActionIcon, Box, Image, Popover } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useUploadBadges, useDownloadBadges } from "../../../hooks/useTournaments";
import FileUploadInput from "../../common/FileUploadInput";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";

interface IProps {
    tournament: ITournament;
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
    const downloadBadgesMutation = useDownloadBadges(tournament._id);
    const { files, handleFileChange, clearFiles } = useFileUpload();

    const uploadOptions = {
        maxFiles: 8,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png"],
    };

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

    return (
        <Stack gap={5}>
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
                            <ActionIcon
                                variant="subtle"
                                onClick={() => downloadBadgesMutation.mutate()}
                                color="success"
                                loading={downloadBadgesMutation.isPending}
                                title="Download badges">
                                <FontAwesomeIcon icon="download" />
                            </ActionIcon>
                        )}
                    </Group>
                ) : null}
            </Group>

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
                                    description="Badge dimensions must be 172x80 pixels"
                                    placeholder="Up to 8 badges"
                                    options={uploadOptions}
                                    imagesOnly
                                />
                            </Box>
                            <ActionIcon
                                variant="subtle"
                                onClick={handleUploadBadges}
                                color="success"
                                title="Save"
                                mb={4}
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
