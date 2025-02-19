import { useState } from "react";
import { Stack, Card, Group, Button, TextInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import { useCreateUser } from "../../hooks/useUsers";

interface IProps {
    onSelect: (user: IUser | null) => void;
}

export default function UsersSection({ onSelect }: IProps) {
    const [userIdToCreate, setUserIdToCreate] = useState("");
    const createUserMutation = useCreateUser();

    const handleCreateUser = async () => {
        if (!userIdToCreate) return;

        const data = await createUserMutation.mutateAsync(userIdToCreate) as { user: IUser, message: string };
        if (data.user) {
            setUserIdToCreate("");
            onSelect(data.user);
        }
    };

    return (
        <Stack gap="md" mt="md">
            <Card shadow="sm" p="md">
                <Stack gap="md">
                    <Group wrap="wrap" align="flex-end">
                        <UserSearch label="Load user" onChange={onSelect} width="250px" />
                        <Group grow align="flex-end">
                            <TextInput
                                label="Create user"
                                placeholder="Enter username or osu! ID..."
                                value={userIdToCreate}
                                onChange={(e) => setUserIdToCreate(e.currentTarget.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && userIdToCreate) {
                                        handleCreateUser();
                                    }
                                }}
                                style={{ minWidth: 250, flex: 1 }}
                            />
                            <Button
                                onClick={handleCreateUser}
                                loading={createUserMutation.isPending}
                                disabled={!userIdToCreate}
                                leftSection={<FontAwesomeIcon icon="plus" />}>
                                Create
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}
