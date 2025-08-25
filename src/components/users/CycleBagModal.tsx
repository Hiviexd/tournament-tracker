import { Modal, Stack, Text, Table, Group, Button, Alert } from "@mantine/core";
import { useCommitteeUsers, useCycleBag } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";
import { useState } from "react";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function CycleBagModal({ opened, onClose }: IProps) {
    const { data: committeeUsers, isLoading } = useCommitteeUsers();
    const cycleBagMutation = useCycleBag();
    const [bagResponse, setBagResponse] = useState<{ message: string; reviewers: any[] } | null>(null);

    const sortedUsers = committeeUsers?.sort((a, b) => {
        return a.username.localeCompare(b.username);
    });

    const bagUsers =
        sortedUsers?.filter((user: IUser) => user.isTournamentCommittee && user.isActiveReviewer && user.inBag) || [];
    const nonBagUsers =
        sortedUsers?.filter((user: IUser) => user.isTournamentCommittee && user.isActiveReviewer && !user.inBag) || [];

    const handleCycleBag = async () => {
        const response = await cycleBagMutation.mutateAsync();
        setBagResponse(response);
    };

    const renderUserRows = (users: any[]) => {
        return users.map((user) => (
            <Table.Tr key={user._id}>
                <Table.Td>
                    <UserDisplay user={user} />
                </Table.Td>
            </Table.Tr>
        ));
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Cycle Assignments" size="lg">
            {isLoading ? (
                <Text>Loading...</Text>
            ) : !committeeUsers?.length ? (
                <Text fs="italic" c="dimmed">
                    No committee members found
                </Text>
            ) : (
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Text size="sm" c="dimmed">
                            TC members grouped by selection pool status
                        </Text>
                        <Button
                            leftSection={<FontAwesomeIcon icon="rotate" />}
                            onClick={handleCycleBag}
                            loading={cycleBagMutation.isPending}
                            disabled={cycleBagMutation.isPending}>
                            Cycle Assignments
                        </Button>
                    </Group>

                    {bagResponse && (
                        <Alert color="green" title={bagResponse.message}>
                            <Text size="sm" fw={500}>
                                Members removed from selection pool:
                            </Text>
                            <Stack gap="xs" mt="xs">
                                {bagResponse.reviewers.map((reviewer, index) => (
                                    <UserDisplay key={index} user={reviewer} />
                                ))}
                            </Stack>
                        </Alert>
                    )}

                    <Stack gap="md">
                        <div>
                            <Text fw={500} mb="xs">
                                In Selection Pool ({bagUsers.length})
                            </Text>
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>User</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{renderUserRows(bagUsers)}</Table.Tbody>
                            </Table>
                        </div>

                        <div>
                            <Text fw={500} mb="xs">
                                Not In Selection Pool ({nonBagUsers.length})
                            </Text>
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>User</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{renderUserRows(nonBagUsers)}</Table.Tbody>
                            </Table>
                        </div>
                    </Stack>
                </Stack>
            )}
        </Modal>
    );
}
