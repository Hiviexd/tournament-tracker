import { Modal, Stack, Text, Table, ActionIcon, Group } from "@mantine/core";
import { useCommitteeUsers } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notifications } from "@mantine/notifications";
import MarkdownText from "../common/MarkdownText";
interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function UserEmailsModal({ opened, onClose }: IProps) {
    const { data: committeeUsers, isLoading } = useCommitteeUsers();

    const sortedUsers = committeeUsers?.sort((a, b) => {
        return a.username.localeCompare(b.username);
    });

    const handleCopyEmail = (email: string | undefined) => {
        if (!email) return;
        navigator.clipboard.writeText(email);
        notifications.show({
            title: "Email Copied",
            message: "Email copied to clipboard!",
            color: "success",
        });
    };

    const rows = sortedUsers?.map((user) => (
        <Table.Tr key={user._id}>
            <Table.Td>
                <UserDisplay user={user} />
            </Table.Td>

            <Table.Td>
                {user.email ? (
                    <Group gap={4}>
                        <ActionIcon variant="subtle" color="success" onClick={() => handleCopyEmail(user.email)}>
                            <FontAwesomeIcon icon="copy" />
                        </ActionIcon>
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
                        <MarkdownText content="This serves purely as a tracker for [TC Google Drive](https://drive.google.com/drive/u/0/folders/1wtDirh70HGK-jtDEL8DdRkp8KSyEOBYb) access." />
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
