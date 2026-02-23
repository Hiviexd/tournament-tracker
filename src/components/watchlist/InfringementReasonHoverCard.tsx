import { forwardRef, ReactNode } from "react";
import { IInfringement } from "../../../interfaces/Infringement";
import { HoverCard, ActionIcon, ScrollArea, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MarkdownText from "../common/MarkdownText";

interface IProps {
    infringement: IInfringement;
    /** When provided, this is the hover target (e.g. badge). Otherwise shows an info icon. */
    children?: ReactNode;
}

/** Wrapper so HoverCard.Target has a ref-capable DOM node (badges don't forward ref). */
const HoverTarget = forwardRef<HTMLSpanElement, { children: ReactNode }>(function HoverTarget({ children }, ref) {
    return (
        <Box component="span" ref={ref} style={{ display: "inline-block", cursor: "default" }}>
            {children}
        </Box>
    );
});

export default function InfringementReasonHoverCard({ infringement, children }: IProps) {
    const reasonContent = infringement.reason?.trim() ? infringement.reason : "*No reason provided*";

    return (
        <HoverCard
            position="left"
            shadow="md"
            withArrow
            openDelay={200}
            closeDelay={100}
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
                </ScrollArea.Autosize>
            </HoverCard.Dropdown>
        </HoverCard>
    );
}
