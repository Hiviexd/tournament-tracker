import { useState } from "react";
import { useSession, useUpdateSession } from "../../../../hooks/useDebug";
import { TextInput, Button, Stack, Text } from "@mantine/core";
import type { UpdateSessionBody } from "../../../../api/debug";

export default function SessionEditor() {
    const { data: session, isLoading: isLoadingSession } = useSession();
    const [changes, setChanges] = useState<Partial<UpdateSessionBody>>({});

    const formData: UpdateSessionBody = {
        mongoId: changes.mongoId ?? session?.mongoId ?? "",
        osuId: changes.osuId ?? session?.osuId?.toString() ?? "",
        username: changes.username ?? session?.username ?? "",
    };

    const { mutate: updateSession, isPending: isUpdatingSession } = useUpdateSession(formData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateSession();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChanges((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <form onSubmit={handleSubmit} style={{ position: "relative" }}>
            <Stack gap="md">
                <Text size="sm" fw={500}>
                    Session Editor
                </Text>

                <TextInput
                    label="Mongo ID"
                    name="mongoId"
                    value={formData.mongoId}
                    onChange={handleChange}
                    disabled={isLoadingSession}
                />

                <TextInput
                    label="osu! ID"
                    name="osuId"
                    type="number"
                    value={formData.osuId}
                    onChange={handleChange}
                    disabled={isLoadingSession}
                />

                <TextInput
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoadingSession}
                />

                <Button type="submit" loading={isUpdatingSession} disabled={isLoadingSession}>
                    Update Session
                </Button>
            </Stack>
        </form>
    );
}
