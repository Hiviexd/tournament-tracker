import { Group, Button, Stack, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../../interfaces/User";
import { useUpdateUserGroups } from "../../../hooks/useUsers";

interface IProps {
    user: IUser;
}

export default function UserGroupMoves({ user }: IProps) {
    const updateUserGroupsMutation = useUpdateUserGroups(user._id || "");

    const handleMove = async (group: string, join: boolean) => {
        try {
            await updateUserGroupsMutation.mutateAsync({
                userId: user._id,
                group,
                join,
            });
        } catch (error) {
            console.error("Failed to group move: " + error);
        }
    };

    return (
        <Stack gap="xs">
            <Title order={4}>Group Management</Title>

            <Group gap="xs">
                {user.groups.includes("tc") ? (
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<FontAwesomeIcon icon="user-minus" />}
                        onClick={() => handleMove("tc", false)}
                        loading={updateUserGroupsMutation.isPending}>
                        Remove from TC
                    </Button>
                ) : (
                    <Button
                        variant="light"
                        color="warning"
                        leftSection={<FontAwesomeIcon icon="user-plus" />}
                        onClick={() => handleMove("tc", true)}
                        loading={updateUserGroupsMutation.isPending}>
                        Add to TC
                    </Button>
                )}

                {user.groups.includes("cc") ? (
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<FontAwesomeIcon icon="user-minus" />}
                        onClick={() => handleMove("cc", false)}
                        loading={updateUserGroupsMutation.isPending}>
                        Remove from CC
                    </Button>
                ) : (
                    <Button
                        variant="light"
                        color="info"
                        leftSection={<FontAwesomeIcon icon="user-plus" />}
                        onClick={() => handleMove("cc", true)}
                        loading={updateUserGroupsMutation.isPending}>
                        Add to CC
                    </Button>
                )}
            </Group>
        </Stack>
    );
}
