import { Modal, Stack, Tabs } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import ReviewerStatusSetting from "./settings/ReviewerStatusSetting";
import VoterStatusSetting from "./settings/VoterStatusSetting";
import DiscordIdSetting from "./settings/DiscordIdSetting";
import EmailSetting from "./settings/EmailSetting";
import ApiKeySection from "./settings/ApiKeySection";
import AutomaticTypeFilterSetting from "./settings/AutomaticTypeFilterSetting";
import NewsSubscriptionSetting from "./settings/NewsSubscriptionSetting";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function SettingsModal({ opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <Modal opened={opened} onClose={onClose} title="Settings" size="lg">
            <Tabs defaultValue="preferences">
                <Tabs.List>
                    <Tabs.Tab value="preferences">Preferences</Tabs.Tab>
                    <Tabs.Tab value="api-key">API Key</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="preferences" mt="md">
                    <Stack>
                        <NewsSubscriptionSetting />
                        {user?.isCommittee && (
                            <>
                                <ReviewerStatusSetting />
                                <VoterStatusSetting />
                                <AutomaticTypeFilterSetting />
                                <DiscordIdSetting />
                                <EmailSetting />
                            </>
                        )}
                    </Stack>
                </Tabs.Panel>
                <Tabs.Panel value="api-key" mt="md">
                    <ApiKeySection />
                </Tabs.Panel>
            </Tabs>
        </Modal>
    );
}
