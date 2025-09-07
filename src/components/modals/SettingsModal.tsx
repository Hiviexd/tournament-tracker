import { Modal, Stack, Divider } from "@mantine/core";
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

    if (!user?.isCommittee) return null;

    return (
        <Modal opened={opened} onClose={onClose} title="Settings" size="lg">
            <Stack>
                <Divider label="Preferences" labelPosition="left" />
                <ReviewerStatusSetting />
                <AutomaticTypeFilterSetting />
                <DiscordIdSetting />
                <EmailSetting />
                <Divider label="API Key" labelPosition="left" />
                <ApiKeySection />
            </Stack>
        </Modal>
    );
}
