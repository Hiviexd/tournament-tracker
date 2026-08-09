import { TextInput, Group, Stack, ActionIcon, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import { useUpdateDiscordId } from "../../../hooks/useUsers";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DiscordIdSetting() {
    const [user] = useAtom(loggedInUserAtom);
    const [discordId, setDiscordId] = useState(user?.discordId || "");
    const updateDiscordId = useUpdateDiscordId(user?.id || "");

    const handleSubmit = async () => {
        try {
            await updateDiscordId.mutateAsync(discordId.toString());
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Stack gap="xs">
            <span>
                <Text size="sm" fw={500}>
                    Discord ID
                </Text>
                <Text size="xs" c="dimmed">
                    Your Discord user ID for notifications
                </Text>
            </span>
            <Group align="center" gap="xs">
                <TextInput
                    placeholder="Enter your Discord ID..."
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    style={{ flex: 1 }}
                />
                <ActionIcon size="lg" variant="subtle" onClick={handleSubmit}>
                    <FontAwesomeIcon icon="floppy-disk" />
                </ActionIcon>
            </Group>
        </Stack>
    );
}
