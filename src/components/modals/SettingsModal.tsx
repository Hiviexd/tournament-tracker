import { Modal, Stack, Tabs } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import ReviewerStatusSetting from "./settings/ReviewerStatusSetting";
import DiscordIdSetting from "./settings/DiscordIdSetting";
import EmailSetting from "./settings/EmailSetting";
import ApiKeySection from "./settings/ApiKeySection";
import AutomaticTypeFilterSetting from "./settings/AutomaticTypeFilterSetting";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function SettingsModal({ opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <Modal opened={opened} onClose={onClose} title="Settings" size="lg">
            <Tabs defaultValue={user?.isCommittee ? "preferences" : "api-key"}>
                <Tabs.List>
                    {user?.isCommittee && <Tabs.Tab value="preferences">Preferences</Tabs.Tab>}
                    <Tabs.Tab value="api-key">API Key</Tabs.Tab>
                </Tabs.List>

                {user?.isCommittee && (
                    <Tabs.Panel value="preferences" mt="md">
                        <Stack>
                            <ReviewerStatusSetting />
                            <AutomaticTypeFilterSetting />
                            <DiscordIdSetting />
                            <EmailSetting />
                        </Stack>
                    </Tabs.Panel>
                )}
                <Tabs.Panel value="api-key" mt="md">
                    <ApiKeySection />
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}
