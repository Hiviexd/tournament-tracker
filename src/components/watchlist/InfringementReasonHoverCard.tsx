import { IInfringement } from "../../../interfaces/Infringement";
import { HoverCard, ActionIcon, ScrollArea } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MarkdownText from "../common/MarkdownText";

interface IProps {
    infringement: IInfringement;
}

export default function InfringementReasonHoverCard({ infringement }: IProps) {
    return (
        <HoverCard position="left" shadow="md" withArrow>
            <HoverCard.Target>
                <ActionIcon variant="subtle">
                    <FontAwesomeIcon icon="info-circle" size="sm" />
                </ActionIcon>
            </HoverCard.Target>
            <HoverCard.Dropdown bg="primary.10">
                <ScrollArea.Autosize maw={300} mah={200} scrollbarSize={8}>
                    <MarkdownText content={infringement.reason} size="sm" />
                </ScrollArea.Autosize>
            </HoverCard.Dropdown>
        </HoverCard>
    );
}
