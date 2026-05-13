import { type HTMLAttributes, type ReactNode, type Ref } from "react";
import { IInfringement } from "../../../interfaces/Infringement";
import { HoverCard, ActionIcon, ScrollArea, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "../../../utils/dayjs";
import MarkdownText from "../common/MarkdownText";

interface IProps {
    infringement: IInfringement;
    /** When provided, this is the hover target (e.g. badge). Otherwise shows an info icon. */
    children?: ReactNode;
}

/** Native span so HoverCard.Target gets a ref-capable DOM node and receives hover handlers (badges don't forward ref). */
function HoverTarget({
    ref,
    children,
    style,
    ...props
}: { children: ReactNode; ref?: Ref<HTMLSpanElement> } & HTMLAttributes<HTMLSpanElement>) {
    return (
        <span ref={ref} style={{ display: "inline-block", ...style }} {...props}>
            {children}
        </span>
    );
}

export default function InfringementReasonHoverCard({ infringement, children }: IProps) {
    const reasonContent = infringement.reason?.trim() ? infringement.reason : "*No reason provided*";

    return (
        <HoverCard
            position="top"
            shadow="md"
            withArrow
            openDelay={150}
            closeDelay={200}
            styles={{ dropdown: { zIndex: 10000 } }}>
            <HoverCard.Target>
                {children != null ? (
                    <HoverTarget>{children}</HoverTarget>
                ) : (
                    <ActionIcon variant="subtle" aria-label="View reason">
                        <FontAwesomeIcon icon="info-circle" size="sm" />
                    </ActionIcon>
                )}
            </HoverCard.Target>
            <HoverCard.Dropdown bg="primary.10">
                <ScrollArea.Autosize maw={300} mah={200} scrollbarSize={8}>
                    <MarkdownText content={reasonContent} size="sm" />
                    {infringement.createdAt ? (
                        <Text size="xs" c="dimmed" mt="xs">
                            {dayjs(infringement.createdAt).fromNow()}
                        </Text>
                    ) : null}
                </ScrollArea.Autosize>
            </HoverCard.Dropdown>
        </HoverCard>
    );
}
