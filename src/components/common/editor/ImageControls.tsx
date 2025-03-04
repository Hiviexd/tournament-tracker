import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RichTextEditor } from "@mantine/tiptap";
import { Popover, TextInput, Button, Group, Stack } from "@mantine/core";

interface ImageControlsProps {
    editor: any;
    disabled: boolean;
}

/**
 * Image controls component for the rich text editor
 * Provides a button for inserting images with a popover for entering the URL
 */
export default function ImageControls({ editor, disabled }: ImageControlsProps) {
    const [opened, setOpened] = useState(false);
    const [url, setUrl] = useState("");
    const [alt, setAlt] = useState("");

    if (!editor) return null;

    const handleInsertImage = () => {
        if (url.trim()) {
            editor
                .chain()
                .focus()
                .setImage({ src: url, alt: alt || undefined })
                .run();
            editor.chain().focus().enter().run();
            setUrl("");
            setAlt("");
            setOpened(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleInsertImage();
        }
    };

    return (
        <RichTextEditor.ControlsGroup>
            <Popover opened={opened} onChange={setOpened} width={300} position="bottom" withArrow shadow="md" trapFocus>
                <Popover.Target>
                    <RichTextEditor.Control
                        onClick={() => setOpened((o) => !o)}
                        aria-label="Insert image"
                        title="Insert image"
                        disabled={disabled}>
                        <FontAwesomeIcon icon="image" size="sm" />
                    </RichTextEditor.Control>
                </Popover.Target>
                <Popover.Dropdown>
                    <Stack gap="xs">
                        <TextInput
                            placeholder="https://example.com/image.jpg"
                            label="Image URL"
                            value={url}
                            onChange={(event) => setUrl(event.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            data-autofocus
                            required
                        />
                        <TextInput
                            placeholder="Image description"
                            label="Alt text (optional)"
                            value={alt}
                            onChange={(event) => setAlt(event.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={() => setOpened(false)} size="xs">
                                Cancel
                            </Button>
                            <Button onClick={handleInsertImage} size="xs">
                                Insert
                            </Button>
                        </Group>
                    </Stack>
                </Popover.Dropdown>
            </Popover>
        </RichTextEditor.ControlsGroup>
    );
}
