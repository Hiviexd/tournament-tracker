import { Card, Image, Stack, Text, Tooltip, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { IAttachment } from "@tc/types/Attachment";

interface IProps {
    attachment: IAttachment;
    cardSize: number;
    iconSize?: "2x" | "3x";
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    hovered?: boolean;
}

export default function AttachmentItem({
    attachment,
    cardSize,
    iconSize = "2x",
    onClick,
    onMouseEnter,
    onMouseLeave,
    hovered = false,
}: IProps) {
    // Reserve room for card padding + filename row so media never pushes text out.
    const frameSize = Math.min(cardSize * 0.7, cardSize - 44);
    const isImage = attachment.type.startsWith("image/");
    const fileName =
        attachment.originalName.length > 20
            ? attachment.originalName.substring(0, 17) + "..."
            : attachment.originalName;

    const getFileIcon = (): IconProp => {
        switch (true) {
            case attachment.type.includes("zip"):
            case attachment.type.includes("rar"):
                return "file-archive";
            case attachment.type.includes("text"):
                return "file-alt";
            default:
                return "file";
        }
    };

    return (
        <Card
            className={`attachment-card ${onClick ? "clickable" : ""} ${hovered ? "hovered" : ""}`}
            style={{ width: cardSize, height: cardSize, cursor: onClick ? "pointer" : "default" }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}>
            {onClick && (
                <Transition mounted={hovered} transition="fade" duration={200}>
                    {(styles) => (
                        <div className="open-overlay" style={styles}>
                            <FontAwesomeIcon icon="up-right-from-square" size="lg" />
                        </div>
                    )}
                </Transition>
            )}
            <Stack align="center" justify="space-between" h="100%" gap={5}>
                <div className="attachment-media" style={{ width: frameSize, height: frameSize }}>
                    {isImage ? (
                        <Image
                            src={attachment.url}
                            alt={attachment.originalName}
                            width={frameSize - 16}
                            height={frameSize - 16}
                            fit="contain"
                            radius="sm"
                        />
                    ) : (
                        <FontAwesomeIcon icon={getFileIcon()} size={iconSize} className="file-icon" />
                    )}
                </div>

                <Tooltip label={attachment.originalName}>
                    <Text size="sm" c="dimmed" className="file-name">
                        {fileName}
                    </Text>
                </Tooltip>
            </Stack>
        </Card>
    );
}
