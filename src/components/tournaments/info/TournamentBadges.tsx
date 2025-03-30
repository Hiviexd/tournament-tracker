import { Stack, Group, Text, ActionIcon, Box, Image } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useUploadBadges } from "../../../hooks/useTournaments";
import FileUploadInput from "../../common/FileUploadInput";
import { useFileUpload } from "../../../hooks/useFileUpload";

interface IProps {
    tournament: ITournament;
}

export default function TournamentBadges({ tournament }: IProps) {
    const [isEditingBadges, setIsEditingBadges] = useState(false);
    const uploadBadgesMutation = useUploadBadges(tournament._id);
    const { files, handleFileChange, clearFiles } = useFileUpload();

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
                ) : (
                    <ActionIcon
                        variant="subtle"
                        onClick={() => setIsEditingBadges(true)}
                        color="info"
                        title="Upload badges">
                        <FontAwesomeIcon icon="pen-to-square" />
                    </ActionIcon>
                )}
            </Group>

            <Group gap="xs" align="start">
                {isEditingBadges ? (
                    <Stack gap="xs" style={{ width: "100%" }}>
                        {badges.length > 0 && (
                            <Group gap="xs">
                                {badges.map((badge, index) => (
                                    <Image
                                        key={index}
                                        src={badge.url}
                                        alt={`Badge ${index + 1}`}
                                        w={86}
                                        h={40}
                                        radius="sm"
                                    />
                                ))}
                            </Group>
                        )}
                        <Group align="end" style={{ width: "50%" }}>
                            <Box style={{ flex: 1 }}>
                                <FileUploadInput
                                    value={files}
                                    onChange={handleFileChange}
                                    label="Upload Badges"
                                    description="Badge dimensions must be 172x80 pixels"
                                />
                            </Box>
                            <ActionIcon
                                variant="subtle"
                                onClick={handleUploadBadges}
                                color="success"
                                title="Save"
                                disabled={!files.length}>
                                <FontAwesomeIcon icon="save" />
                            </ActionIcon>
                        </Group>
                    </Stack>
                ) : badges.length > 0 ? (
                    <Group gap="xs">
                        {badges.map((badge, index) => (
                            <Image key={index} src={badge.url} alt={`Badge ${index + 1}`} w={86} h={40} radius="sm" />
                        ))}
                    </Group>
                ) : (
                    <Box
                        w={86}
                        h={40}
                        style={{
                            border: "1px solid var(--mantine-color-gray-3)",
                            borderRadius: "var(--mantine-radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                        <Text size="xs" c="dimmed">
                            None
                        </Text>
                    </Box>
                )}
            </Group>
        </Stack>
    );
}
