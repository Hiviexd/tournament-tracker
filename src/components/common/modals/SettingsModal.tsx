import { Modal, Stack, Divider } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import ReviewerStatusSetting from "./settings/ReviewerStatusSetting";
import DiscordIdSetting from "./settings/DiscordIdSetting";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function SettingsModal({ opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    if (!user?.isCommittee) return null;

    return (
        <Modal opened={opened} onClose={onClose} title="Settings" size="md">
            <Stack>
                <ReviewerStatusSetting />
                <Divider />
                <DiscordIdSetting />
            </Stack>
        </Modal>
    );
}
