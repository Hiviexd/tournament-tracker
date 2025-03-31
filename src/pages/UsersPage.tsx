import { useSearchParams } from "react-router-dom";
import { Card, Divider, Stack, Button, Group } from "@mantine/core";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UserEmailsModal from "../components/users/UserEmailsModal";
import UserSearch from "../components/common/UserSearch";
import CommitteeSection from "../components/users/CommitteeSection";
import { IUser } from "../../interfaces/User";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const setSelectedUser = useSetAtom(selectedUserAtom);
    const [opened, { open, close }] = useDisclosure(false);

    const handleUserModalClose = () => {
        setSearchParams({});
        setSelectedUser(null);
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
            <UserEmailsModal opened={opened} onClose={close} />

            <Card shadow="sm" p="md">
                <Stack gap="lg">
                    <UserSearch label="Load or create user" width="100%" onChange={handleUserSelect} allowUserCreation />
                    <Group justify="flex-start">
                        <Button variant="light" onClick={open} leftSection={<FontAwesomeIcon icon="envelope" />}>
                        Show emails list
                        </Button>
                    </Group>
                </Stack>
            </Card>
            <Divider />
            <CommitteeSection onSelect={handleUserSelect} showBadges />
        </Stack>
    );
}
