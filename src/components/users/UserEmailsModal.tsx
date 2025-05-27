import { Modal, Stack, Text, Table, Group } from "@mantine/core";
import { useCommitteeUsers } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";
import CopyActionIcon from "../common/buttons/CopyActionIcon";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function UserEmailsModal({ opened, onClose }: IProps) {
    const { data: committeeUsers, isLoading } = useCommitteeUsers();

    const sortedUsers = committeeUsers?.sort((a, b) => {
        return a.username.localeCompare(b.username);
    });

    const rows = sortedUsers?.map((user) => (
        <Table.Tr key={user._id}>
            <Table.Td>
                <UserDisplay user={user} />
            </Table.Td>

            <Table.Td>
                {user.email ? (
                    <Group gap={4}>
                        <CopyActionIcon value={user.email} />
                        <Text size="sm">{user.email}</Text>
                    </Group>
                ) : (
                    <Text fs="italic" c="dimmed" size="sm">
                        No email provided
                    </Text>
                )}
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Committee Emails"
            size="lg"
            styles={{
                title: {
                    fontWeight: 600,
                },
            }}>
            {isLoading ? (
                <Text>Loading...</Text>
            ) : !committeeUsers?.length ? (
                <Text fs="italic" c="dimmed">
                    No committee members found
                </Text>
            ) : (
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        This serves purely as a tracker for TC Google Drive access.
                    </Text>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>User</Table.Th>
                                <Table.Th>Email</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Stack>
            )}
        </Modal>
    );
}
