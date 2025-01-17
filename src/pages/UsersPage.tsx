import { useSearchParams } from "react-router-dom";
import { Divider, Stack } from "@mantine/core";
import { useSetAtom } from "jotai";
import { selectedUserAtom } from "../store/atoms";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UsersSection from "../components/users/UsersSection";
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
        <Stack gap="xl">
            <UserDetailsModal userId={searchParams.get("id")} onClose={handleModalClose} />

            <UsersSection onSelect={handleUserSelect} />
            <Divider />
            <CommitteeSection onSelect={handleUserSelect} />
        </Stack>
    );
}
