import { useSearchParams } from "react-router-dom";
import { Card, Divider, Stack, Button, Group } from "@mantine/core";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UserEmailsModal from "../components/users/UserEmailsModal";
import CycleBagModal from "../components/users/CycleBagModal";
import UserSearch from "../components/common/UserSearch";
import CommitteeSection from "../components/users/CommitteeSection";
import { IUser } from "@tc/types/User";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const setSelectedUser = useSetAtom(selectedUserAtom);
    const [emailsModalOpened, { open: openEmailsModal, close: closeEmailsModal }] = useDisclosure(false);
    const [cycleBagModalOpened, { open: openCycleBag, close: closeCycleBagModal }] = useDisclosure(false);

    const handleUserModalClose = () => {
        setSearchParams({});
    };

    const handleUserSelect = (user: IUser | null) => {
        if (user) {
            setSelectedUser(user);
            setSearchParams({ id: user.osuId.toString() });
        }
    };

    return (
        <Stack gap="lg">
            <UserDetailsModal userId={searchParams.get("id")} onClose={handleUserModalClose} />
            <UserEmailsModal opened={emailsModalOpened} onClose={closeEmailsModal} />
            <CycleBagModal opened={cycleBagModalOpened} onClose={closeCycleBagModal} />
            <Card shadow="sm" p="md">
                <Stack gap="lg">
                    <UserSearch
                        label="Load or create user"
                        width="100%"
                        onChange={handleUserSelect}
                        allowUserCreation
                    />
                    <Group justify="flex-start">
                        <Button
                            variant="light"
                            onClick={openEmailsModal}
                            leftSection={<FontAwesomeIcon icon="envelope" />}>
                            Emails list
                        </Button>
                        <Button variant="light" onClick={openCycleBag} leftSection={<FontAwesomeIcon icon="rotate" />}>
                            Cycle Assignments
                        </Button>
                    </Group>
                </Stack>
            </Card>
            <Divider />
            <CommitteeSection onSelect={handleUserSelect} showBadges />
        </Stack>
    );
}
