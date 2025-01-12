import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { IUser } from "../../interfaces/User";
import { useUser, useCommitteeUsers, useCreateUser } from "../hooks/useUsers";
import { Tabs, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notifications } from "@mantine/notifications";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UsersTab from "../components/users/UsersTab";
import CommitteeTab from "../components/users/CommitteeTab";

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [userIdToCreate, setUserIdToCreate] = useState("");
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>("users");

    const urlUserId = searchParams.get("id");
    const { data: userFromUrl, isLoading: isLoadingUser } = useUser(urlUserId);
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

    return (
        <Stack gap="md">
            <UserDetailsModal
                opened={modalOpened}
                onClose={handleModalClose}
                user={selectedUser}
                isLoading={isLoadingUser}
            />

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
                    <UsersTab
                        onUserSelect={handleUserSelect}
                        userIdToCreate={userIdToCreate}
                        onUserIdChange={setUserIdToCreate}
                        onCreateUser={handleCreateUser}
                        isCreating={createUserMutation.isPending}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="committee">
                    <CommitteeTab
                        users={committeeUsers}
                        isLoading={isLoadingCommittee}
                        onUserSelect={handleUserSelect}
                    />
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
