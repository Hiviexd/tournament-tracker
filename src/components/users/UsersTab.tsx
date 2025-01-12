import { Stack, Card, Group, Button, TextInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../interfaces/User";
import UserSearch from "../common/UserSearch";

interface IProps {
    onUserSelect: (user: IUser) => void;
    userIdToCreate: string;
    onUserIdChange: (value: string) => void;
    onCreateUser: () => void;
    isCreating: boolean;
}

export default function UsersTab({
    onUserSelect,
    userIdToCreate,
    onUserIdChange,
    onCreateUser,
    isCreating,
}: IProps) {
    return (
        <Stack gap="md" mt="md">
            <Card shadow="sm" p="md">
                <UserSearch label="Load user" onChange={onUserSelect} width="25%" />
            </Card>

            <Card shadow="sm" p="md">
                <Group align="flex-end">
                    <TextInput
                        label="Create user"
                        placeholder="Enter username or osu! ID..."
                        value={userIdToCreate}
                        onChange={(e) => onUserIdChange(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && userIdToCreate) {
                                onCreateUser();
                            }
                        }}
                        style={{ width: "25%" }}
                    />
                    <Button
                        onClick={onCreateUser}
                        loading={isCreating}
                        disabled={!userIdToCreate}
                        leftSection={<FontAwesomeIcon icon="plus" />}>
                        Create User
                    </Button>
                </Group>
            </Card>
        </Stack>
    );
}
