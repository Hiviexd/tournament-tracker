import { useState } from "react";
import { Stack, Card, Group, Button, TextInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../../store/atoms";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";
import { useCreateUser } from "../../hooks/useUsers";

interface IProps {
    onSelect: (userId: string) => void;
}

export default function UsersTab({ onSelect }: IProps) {
    const [userIdToCreate, setUserIdToCreate] = useState("");
    const createUserMutation = useCreateUser();
    const setSelectedUser = useSetAtom(selectedUserAtom);

    const handleSearchSelect = (user: IUser | null) => {
        if (user) {
            setSelectedUser(user);
            onSelect(user.osuId.toString());
        }
    };

    const handleCreateUser = async () => {
        if (!userIdToCreate) return;

        const user = await createUserMutation.mutateAsync(userIdToCreate) as IUser | null;
        if (user) {
            setUserIdToCreate("");
            setSelectedUser(user as IUser);
            onSelect(user.osuId.toString());
        }
    };

    return (
        <Stack gap="md" mt="md">
            <Card shadow="sm" p="md">
                <UserSearch label="Load user" onChange={handleSearchSelect} width="25%" />
            </Card>

            <Card shadow="sm" p="md">
                <Group align="flex-end">
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
                        style={{ width: "25%" }}
                    />
                    <Button
                        onClick={handleCreateUser}
                        loading={createUserMutation.isPending}
                        disabled={!userIdToCreate}
                        leftSection={<FontAwesomeIcon icon="plus" />}>
                        Create User
                    </Button>
                </Group>
            </Card>
        </Stack>
    );
}
