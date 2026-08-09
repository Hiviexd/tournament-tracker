import { Modal, Stack } from "@mantine/core";
import { useAtom } from "jotai";
import SessionEditor from "./debug/SessionEditor";
import { loggedInUserAtom } from "../../store/atoms";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function DebugModal({ opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    if (!user?.isDev) return null;
    return (
        <Modal opened={opened} onClose={onClose} title="Debug Tools" size="md">
            <Stack>
                <SessionEditor />
            </Stack>
        </Modal>
    );
}
