import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, Stack } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserDetailsModal from "../components/users/UserDetailsModal";
import UsersTab from "../components/users/UsersTab";
import CommitteeTab from "../components/users/CommitteeTab";

export default function UsersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<string | null>("users");

    return (
        <Stack gap="md">
            <UserDetailsModal userId={searchParams.get("id")} onClose={() => setSearchParams({})} />

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
                    <UsersTab onSelect={(userId) => setSearchParams({ id: userId })} />
                </Tabs.Panel>

                <Tabs.Panel value="committee">
                    <CommitteeTab
                        active={activeTab === "committee"}
                        onSelect={(userId) => setSearchParams({ id: userId })}
                    />
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
