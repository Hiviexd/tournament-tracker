import { Modal, Stack, Text, Table, Group, Button, Alert } from "@mantine/core";
import { useCommitteeUsers, useCycleBag } from "../../hooks/useUsers";
import UserDisplay from "../common/UserDisplay";
import { useState } from "react";
import { IUser } from "@tc/types/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AlertText from "../common/AlertText";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function CycleBagModal({ opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const { data: committeeUsers, isLoading } = useCommitteeUsers();
    const cycleBagMutation = useCycleBag();
    const [bagResponse, setBagResponse] = useState<{ message: string; reviewers: IUser[] } | null>(null);

    const sortedUsers = committeeUsers?.sort((a: IUser, b: IUser) => {
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

    const renderUserRows = (users: IUser[]) => {
        return users.map((user) => (
            <Table.Tr key={user.id}>
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
                        <AlertText type="warning">Avoid using this button unless investigating issues.</AlertText>
                        <Button
                            leftSection={<FontAwesomeIcon icon="rotate" />}
                            onClick={handleCycleBag}
                            loading={cycleBagMutation.isPending}
                            disabled={!user?.isAdmin}>
                            Cycle Assignments
                        </Button>
                    </Group>

                    {bagResponse && (
                        <Alert color="green" title={bagResponse.message}>
                            <Text size="sm" fw={500}>
                                Members removed from selection pool:
                            </Text>
                            <Group gap="xl" mt="xs">
                                {bagResponse.reviewers.map((reviewer, index) => (
                                    <UserDisplay key={index} user={reviewer} />
                                ))}
                            </Group>
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
