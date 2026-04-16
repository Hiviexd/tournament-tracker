import { Button, Group, Image, Modal, Stack } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { IAttachment } from "../../../interfaces/Attachment";
import AttachmentItem from "./AttachmentItem";

interface IProps {
    attachments: IAttachment[];
    size?: number;
}

export default function AttachmentDisplay({ attachments, size = 120 }: IProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [opened, setOpened] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const modalCardSize = Math.max(size * 2, 220);

    if (!attachments.length) return null;

    return (
        <>
            <Group gap="sm">
                {attachments.map((attachment, index) => {
                    const hovered = hoveredIndex === index;

                    return (
                        <AttachmentItem
                            key={attachment.id}
                            attachment={attachment}
                            cardSize={size}
                            hovered={hovered}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => {
                                setActiveIndex(index);
                                setOpened(true);
                            }}
                        />
                    );
                })}
            </Group>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={`${activeIndex + 1} / ${attachments.length}`}
                centered
                size="80%">
                <Carousel
                    withIndicators={attachments.length > 1}
                    withControls={attachments.length > 1}
                    initialSlide={activeIndex}
                    onSlideChange={setActiveIndex}
                    emblaOptions={{ align: "center", loop: attachments.length > 1 }}>
                    {attachments.map((attachment) => {
                        const isImage = attachment.type.startsWith("image/");
                        const isTextFile = attachment.type.startsWith("text/");
                        return (
                            <Carousel.Slide key={attachment.id}>
                                <Stack gap="md" align="center">

                                    {isImage ? (
                                        <Image
                                            src={attachment.url}
                                            alt={attachment.originalName}
                                            mah="60vh"
                                            fit="contain"
                                            radius="md"
                                        />
                                    ) : (
                                        <Stack align="center" justify="center" gap="sm" mih="60vh">
                                            <AttachmentItem attachment={attachment} cardSize={modalCardSize} iconSize="3x" />
                                            <Button
                                                component="a"
                                                href={attachment.url}
                                                download={attachment.originalName}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                leftSection={<FontAwesomeIcon icon={isTextFile ? "up-right-from-square" : "download"} />}>
                                                {isTextFile ? "Open" : "Download"}
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                            </Carousel.Slide>
                        );
                    })}
                </Carousel>
            </Modal>
        </>
    );
}
