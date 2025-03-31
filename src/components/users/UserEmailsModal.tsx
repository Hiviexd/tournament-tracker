import { Modal, Stack, Text, Table } from "@mantine/core";
import { useCommitteeUsers } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";

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
                    <Text size="sm">{user.email}</Text>
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
            <Stack gap="md">
                {isLoading ? (
                    <Text>Loading...</Text>
                ) : !committeeUsers?.length ? (
                    <Text fs="italic" c="dimmed">
                        No committee members found
                    </Text>
                ) : (
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>User</Table.Th>
                                <Table.Th>Email</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                )}
            </Stack>
        </Modal>
    );
}
