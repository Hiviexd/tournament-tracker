import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";

type ConfirmModalProps = Parameters<typeof modals.openConfirmModal>[0];

interface BaseProps {
    preset?: "confirm" | "delete";
    title?: string;
    size?: ConfirmModalProps["size"];
    confirmText?: string;
    cancelText?: string;
    confirmProps?: ConfirmModalProps["confirmProps"];
    cancelProps?: ConfirmModalProps["cancelProps"];
}

interface WithText extends BaseProps {
    text: string;
    children?: never;
}

interface WithChildren extends BaseProps {
    children: React.ReactNode;
    text?: never;
}

type ConfirmModalOptions = WithText | WithChildren;

/**
 * Initiates a confirmation modal.
 * @returns An async function that takes the params below, opens the modal, and returns a promise that resolves to a boolean indicating confirmation state.
 * @param preset - Preset to use for the modal.
 * @param title - Title override for the modal.
 * @param size - Modal width, same as Mantine `Modal`/`openConfirmModal` (`sm`, `md`, `lg`, `xl`, or a CSS size).
 * @param children - Children to render in the modal.
 * @param text - Text to render in the modal.
 * @param confirmText - Text to render in the confirm button.
 * @param cancelText - Text to render in the cancel button.
 * @param confirmProps - Props to pass to the confirm button.
 * @param cancelProps - Props to pass to the cancel button.
 */
export function useConfirmModal() {
    const openModal = (options: ConfirmModalOptions) =>
        new Promise<boolean>((resolve) => {
            const { preset, title, size, children, text, confirmText, cancelText, confirmProps, cancelProps } = options;

            const presetConfirmText = preset === "delete" ? "Delete" : "Confirm";
            const presetConfirmProps =
                preset === "delete"
                    ? { leftSection: <FontAwesomeIcon icon="trash" />, color: "red" }
                    : { leftSection: <FontAwesomeIcon icon="check" /> };

            modals.openConfirmModal({
                title: title || "Confirm your action",
                size,
                children: text ? <Text size="sm">{text}</Text> : children,
                labels: { confirm: confirmText || presetConfirmText, cancel: cancelText || "Cancel" },
                confirmProps: { ...presetConfirmProps, ...confirmProps },
                cancelProps: { variant: "light", color: "gray", ...cancelProps },
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
            });
        });

    return openModal;
}
