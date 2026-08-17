import { Box, Button, Group, Image, Modal, Stack, Text, UnstyledButton } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import AttachmentItem, { type AttachmentPreview } from "./AttachmentItem";

interface IProps {
    attachments: AttachmentPreview[];
    size?: number;
    onRemove?: (index: number) => void;
}

export default function AttachmentDisplay({ attachments, size = 120, onRemove }: IProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [opened, setOpened] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [carouselApi, setCarouselApi] = useState<{ scrollTo: (index: number) => void } | null>(null);
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
                            onRemove={onRemove ? () => onRemove(index) : undefined}
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
                title="Attachments"
                centered
                size="80%"
                classNames={{
                    content: "attachment-modal-content",
                    header: "attachment-modal-header",
                }}>
                <Carousel
                    withControls={attachments.length > 1}
                    initialSlide={activeIndex}
                    onSlideChange={setActiveIndex}
                    getEmblaApi={setCarouselApi}
                    classNames={{ viewport: "attachment-carousel-viewport" }}
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
                                            <AttachmentItem
                                                attachment={attachment}
                                                cardSize={modalCardSize}
                                                iconSize="3x"
                                            />
                                            <Button
                                                component="a"
                                                href={attachment.url}
                                                download={attachment.originalName}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                leftSection={
                                                    <FontAwesomeIcon
                                                        icon={isTextFile ? "up-right-from-square" : "download"}
                                                    />
                                                }>
                                                {isTextFile ? "Open" : "Download"}
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                            </Carousel.Slide>
                        );
                    })}
                </Carousel>

                {attachments.length > 1 && (
                    <Group justify="center" gap={8} mt="md" className="attachment-carousel-indicators">
                        {attachments.map((attachment, index) => (
                            <UnstyledButton
                                key={attachment.id}
                                onClick={() => carouselApi?.scrollTo(index)}
                                aria-label={`Go to attachment ${index + 1}`}
                                className="attachment-carousel-indicator"
                                data-active={index === activeIndex || undefined}
                            />
                        ))}
                    </Group>
                )}

                <Box mt="xs" className="attachment-carousel-counter-wrap">
                    <Text ta="center" size="sm" className="attachment-carousel-counter">
                        {activeIndex + 1} / {attachments.length}
                    </Text>
                </Box>
            </Modal>
        </>
    );
}
