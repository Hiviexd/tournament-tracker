import { Card, Image, Text, Tooltip, Stack, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useState } from "react";
import { IAttachment } from "../../../interfaces/Attachment";

interface IProps {
    attachment: IAttachment;
    size?: number;
}

export default function AttachmentDisplay({ attachment, size = 120 }: IProps) {
    const [hovered, setHovered] = useState(false);
    const isImage = attachment.type.startsWith("image/");
    const frameSize = size * 0.7;

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

    const fileName =
        attachment.originalName.length > 20
            ? attachment.originalName.substring(0, 17) + "..."
            : attachment.originalName;

    return (
        <Card
            component="a"
            href={attachment.url}
            download={attachment.originalName}
            target="_blank"
            className={`attachment-card ${hovered ? "hovered" : ""}`}
            style={{ width: size, height: size }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            <Transition mounted={hovered} transition="fade" duration={200}>
                {(styles) => (
                    <div className="download-overlay" style={styles}>
                        <FontAwesomeIcon icon="download" size="lg" />
                    </div>
                )}
            </Transition>

            <Stack align="center" justify="space-between" h="100%" gap={5}>
                <Card className="preview-frame" style={{ width: frameSize, height: frameSize }}>
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
                        <FontAwesomeIcon icon={getFileIcon()} size="2x" className="file-icon" />
                    )}
                </Card>

                <Tooltip label={attachment.originalName}>
                    <Text size="sm" c="dimmed" className="file-name">
                        {fileName}
                    </Text>
                </Tooltip>
            </Stack>
        </Card>
    );
}
