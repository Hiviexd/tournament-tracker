import { useSearchParams } from "react-router-dom";
import { Card, Divider, Stack } from "@mantine/core";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UserSearch from "../components/common/UserSearch";
import CommitteeSection from "../components/users/CommitteeSection";
import { IUser } from "../../interfaces/User";

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const setSelectedUser = useSetAtom(selectedUserAtom);

    const handleModalClose = () => {
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
            <UserDetailsModal userId={searchParams.get("id")} onClose={handleModalClose} />

            <Card shadow="sm" p="md">
                <UserSearch label="Load or create user" width="100%" onChange={handleUserSelect} allowUserCreation />
            </Card>
            <Divider />
            <CommitteeSection onSelect={handleUserSelect} showBadges />
        </Stack>
    );
}
