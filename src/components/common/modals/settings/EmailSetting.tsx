import { TextInput, Group, Stack, ActionIcon, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../../store/atoms";
import { useUpdateEmail } from "../../../../hooks/useUsers";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function EmailSetting() {
    const [user] = useAtom(loggedInUserAtom);
    const [email, setEmail] = useState(user?.email || "");
    const updateEmail = useUpdateEmail(user?._id || "");

    const handleSubmit = async () => {
        try {
            await updateEmail.mutateAsync(email);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Stack gap="xs">
            <span>
                <Text size="sm" fw={500}>
                    Email
                </Text>
                <Text size="xs" c="dimmed">
                    Your email for Google Drive access (ping a TC member after setting this)
                </Text>
            </span>
            <Group align="center" gap="xs">
                <TextInput
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ flex: 1 }}
                />
                <ActionIcon size="lg" variant="subtle" onClick={handleSubmit}>
                    <FontAwesomeIcon icon="floppy-disk" />
                </ActionIcon>
            </Group>
        </Stack>
    );
}
