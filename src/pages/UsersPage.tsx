// Base
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { IUser } from "../../interfaces/User";
import { useUser, useCommitteeUsers, useCreateUser } from "../hooks/useUsers";

// Mantine
import { Tabs, Stack, Card, Group, Button, TextInput, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notifications } from "@mantine/notifications";

// Components
import UserSearch from "../components/common/UserSearch";
import UserDisplay from "../components/common/UserDisplay";

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [userIdToCreate, setUserIdToCreate] = useState("");
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>("users");

    // URL param handling
    const urlUserId = searchParams.get("id");
    const { data: userFromUrl, isLoading: isLoadingUser } = useUser(urlUserId);

    // Committee users - only enabled when committee tab is active
    const { data: committeeUsers = [], isLoading: isLoadingCommittee } = useCommitteeUsers({
        enabled: activeTab === "committee",
    });

    const createUserMutation = useCreateUser();

    const handleUserSelect = useCallback(
        (user: IUser) => {
            setSelectedUser(user);
            setSearchParams({ id: user.osuId.toString() });
            openModal();
        },
        [setSearchParams, openModal]
    );

    const handleModalClose = useCallback(() => {
        setSearchParams({});
        setSelectedUser(null);
        closeModal();
    }, [setSearchParams, closeModal]);

    const handleUserSearch = (user: IUser | null) => {
        if (user) {
            handleUserSelect(user);
        }
    };

    const handleCreateUser = async () => {
        if (!userIdToCreate) return;

        const user = await createUserMutation.mutateAsync(userIdToCreate);
        if (user) {
            setUserIdToCreate("");
            handleUserSelect(user as IUser);
        }
    };

    useEffect(() => {
        if (urlUserId && !isLoadingUser) {
            if (!userFromUrl || userFromUrl.error) {
                notifications.show({
                    title: "Error",
                    message: "User not found",
                    color: "red",
                });
                handleModalClose();
            } else if (userFromUrl) {
                handleUserSelect(userFromUrl);
            }
        }
    }, [urlUserId, userFromUrl, isLoadingUser, handleUserSelect, handleModalClose]);

    // TODO use skeletons
    const LoadingState = () => (
        <Card shadow="sm" p="md">
            <Text c="dimmed">Loading...</Text>
        </Card>
    );

    // TODO use skeletons
    const ModalLoadingState = () => (
        <Card shadow="sm" p="md">
            <Text c="dimmed">Loading...</Text>
        </Card>
    );

    return (
        <Stack gap="md">
            <Modal opened={modalOpened} onClose={handleModalClose} title="User Details" size="lg">
                {isLoadingUser ? (
                    <ModalLoadingState />
                ) : selectedUser ? (
                    <Stack>
                        <UserDisplay user={selectedUser} />
                    </Stack>
                ) : null}
            </Modal>
            <Tabs defaultValue="users" onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="users" leftSection={<FontAwesomeIcon icon="users" />}>
                        Users
                    </Tabs.Tab>
                    <Tabs.Tab value="committee" leftSection={<FontAwesomeIcon icon="user-tie" />}>
                        Committee
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="users">
                    <Stack gap="md" mt="md">
                        <Card shadow="sm" p="md">
                            <UserSearch label="Load user" onChange={handleUserSearch} width="25%" />
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
                </Tabs.Panel>

                <Tabs.Panel value="committee">
                    <Stack gap="md" mt="md">
                        {isLoadingCommittee ? (
                            <LoadingState />
                        ) : (
                            committeeUsers.map((user) => (
                                <Card
                                    key={user._id}
                                    shadow="sm"
                                    p="md"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleUserSelect(user)}>
                                    <UserDisplay user={user} />
                                </Card>
                            ))
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
