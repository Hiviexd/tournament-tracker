import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { useEffect, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { ActionIcon, Box, Group, Textarea, Tooltip, Text, Badge, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useAutoSave } from "../../hooks/useAutoSave";

interface TextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    className?: string;
    disabled?: boolean;
    autoSaveKey?: string; // Optional key for autosaving
}

export default function TextEditor({
    value,
    onChange,
    placeholder = "Type your content here...",
    minHeight = 200,
    maxHeight,
    className,
    disabled = false,
    autoSaveKey,
}: TextEditorProps) {
    const [isMarkdownMode, setIsMarkdownMode] = useState(false);
    const [showSavedIndicator, setShowSavedIndicator] = useState(false);

    // Always call useAutoSave to avoid conditional hook call
    const {
        value: autoSavedValue,
        setValue: setAutoSavedValue,
        isSaved: autoSaveIsSaved,
        isTyping: autoSaveIsTyping,
    } = useAutoSave({
        key: autoSaveKey || "temp-editor-key",
        initialValue: value,
        onSave: () => {
            // This callback is optional - we're already calling onChange
            // when the editor content changes
        },
    });

    // Only use autoSave values if autoSaveKey is provided
    const isAutoSaveEnabled = Boolean(autoSaveKey);
    const editorValue = isAutoSaveEnabled ? autoSavedValue : value;
    const setEditorValue = isAutoSaveEnabled ? setAutoSavedValue : () => {};

    // Handle the saved indicator visibility
    useEffect(() => {
        if (isAutoSaveEnabled) {
            if (autoSaveIsSaved) {
                // Show the indicator when content is saved
                setShowSavedIndicator(true);
            } else if (autoSaveIsTyping) {
                // Hide the indicator when typing
                setShowSavedIndicator(false);
            }
        }
    }, [autoSaveIsSaved, autoSaveIsTyping, isAutoSaveEnabled]);

    // Calculate approximate number of rows based on minHeight
    // Assuming average line height of 20px
    const approximateMinRows = Math.max(3, Math.floor((minHeight - 42) / 20));

    // Initialize the editor with all the extensions we need
    const editor = useEditor({
        extensions: [
            StarterKit,
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    rel: "noopener noreferrer",
                    target: "_blank",
                },
            }),
            Markdown.configure({
                html: false,
                transformPastedText: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: editorValue,
        onUpdate: ({ editor }) => {
            // Get the content as markdown and pass it to the onChange handler
            const markdown = editor.storage.markdown.getMarkdown();

            if (isAutoSaveEnabled) {
                // Only update if content has actually changed
                if (markdown !== autoSavedValue) {
                    setEditorValue(markdown);
                }
            }

            onChange(markdown);
        },
        editable: !disabled && !isMarkdownMode,
    });

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (editor && value !== undefined && !isAutoSaveEnabled) {
            const currentMarkdown = editor.storage.markdown.getMarkdown();
            if (currentMarkdown !== value) {
                editor.commands.setContent(value);
            }
        }
    }, [editor, value, isAutoSaveEnabled]);

    // Update editor's editable state when disabled prop or mode changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled && !isMarkdownMode);
        }
    }, [editor, disabled, isMarkdownMode]);

    // Handle markdown text changes in raw mode
    const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        if (isAutoSaveEnabled) {
            // Only update if content has actually changed
            if (newValue !== autoSavedValue) {
                setEditorValue(newValue);
            }
        }

        onChange(newValue);
    };

    if (!editor) {
        return null;
    }

    const toggleMarkdownMode = () => {
        setIsMarkdownMode(!isMarkdownMode);
    };

    return (
        <Box className={className}>
            {isMarkdownMode ? (
                <>
                    <Box
                        style={{
                            padding: "10px 16px",
                            borderBottom: "1px solid var(--mantine-color-primary-5)",
                            borderTop: "1px solid var(--mantine-color-default-border)",
                            borderLeft: "1px solid var(--mantine-color-default-border)",
                            borderRight: "1px solid var(--mantine-color-default-border)",
                            borderTopLeftRadius: "var(--mantine-radius-sm)",
                            borderTopRightRadius: "var(--mantine-radius-sm)",
                            backgroundColor: "var(--mantine-color-primary-10)",
                        }}>
                        <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs">
                                <Text fw={500} fz="14px">
                                    Markdown Editor{" "}
                                    <Link
                                        to="/markdown"
                                        style={{ fontSize: "12px" }}
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        (guide)
                                    </Link>
                                </Text>
                                <Transition
                                    mounted={isAutoSaveEnabled && showSavedIndicator}
                                    transition="fade"
                                    duration={400}>
                                    {(styles) => (
                                        <Badge color="green" size="xs" variant="light" style={styles}>
                                            Saved
                                        </Badge>
                                    )}
                                </Transition>
                            </Group>
                            <Tooltip label="Rich Text Mode" position="bottom">
                                <ActionIcon
                                    variant="default"
                                    onClick={toggleMarkdownMode}
                                    disabled={disabled}
                                    aria-label="Toggle rich text mode"
                                    styles={{
                                        root: {
                                            "&:hover": {
                                                backgroundColor: "var(--mantine-color-primary-4)",
                                            },
                                        },
                                    }}>
                                    <FontAwesomeIcon icon="edit" />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Box>
                    <Textarea
                        value={editorValue}
                        onChange={handleMarkdownChange}
                        placeholder={placeholder}
                        minRows={approximateMinRows}
                        maxRows={maxHeight ? Math.floor(maxHeight / 20) : undefined}
                        autosize
                        disabled={disabled}
                        styles={{
                            root: {
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                            },
                            input: {
                                fontFamily: "monospace",
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                                backgroundColor: "var(--mantine-color-primary-11) !important",
                            },
                        }}
                    />
                </>
            ) : (
                <RichTextEditor
                    editor={editor}
                    styles={{
                        root: {
                            minHeight,
                            ...(maxHeight ? { maxHeight } : {}),
                            opacity: disabled ? 0.6 : 1,
                            "--rte-color": "var(--mantine-color-primary-filled)",
                            "--rte-hover-color": "var(--mantine-color-primary-light-hover)",
                            "--rte-active-color": "var(--mantine-color-primary-light)",
                            "--rte-toolbar-bg": "var(--mantine-color-primary-light-color)",
                            "--rte-radius": "var(--mantine-radius-sm)",
                        },
                        content: {
                            minHeight: minHeight - 40, // Subtract toolbar height
                            ...(maxHeight ? { maxHeight: maxHeight - 40 } : {}),
                        },
                        toolbar: {
                            backgroundColor: "var(--mantine-color-primary-10)",
                            borderColor: "var(--mantine-color-primary-5)",
                        },
                        control: {
                            "&:hover": {
                                backgroundColor: "var(--mantine-color-primary-4)",
                            },
                        },
                    }}>
                    <RichTextEditor.Toolbar sticky stickyOffset={0}>
                        <Group justify="space-between" wrap="nowrap" style={{ width: "100%" }}>
                            <Group wrap="nowrap">
                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Bold />
                                    <RichTextEditor.Italic />
                                    <RichTextEditor.Strikethrough />
                                    <RichTextEditor.Code />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.H1 />
                                    <RichTextEditor.H2 />
                                    <RichTextEditor.H3 />
                                    <RichTextEditor.H4 />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Blockquote />
                                    <RichTextEditor.Hr />
                                    <RichTextEditor.BulletList />
                                    <RichTextEditor.OrderedList />
                                    <RichTextEditor.CodeBlock />
                                </RichTextEditor.ControlsGroup>

                                <RichTextEditor.ControlsGroup>
                                    <RichTextEditor.Link />
                                    <RichTextEditor.Unlink />
                                </RichTextEditor.ControlsGroup>
                            </Group>

                            <Group gap="xs">
                                <Transition
                                    mounted={isAutoSaveEnabled && showSavedIndicator}
                                    transition="fade"
                                    duration={400}>
                                    {(styles) => (
                                        <Badge color="green" size="xs" variant="light" style={styles}>
                                            Saved
                                        </Badge>
                                    )}
                                </Transition>
                                <RichTextEditor.ControlsGroup>
                                    <Tooltip label="Markdown Mode" position="bottom">
                                        <ActionIcon
                                            variant="default"
                                            onClick={toggleMarkdownMode}
                                            disabled={disabled}
                                            aria-label="Toggle markdown mode">
                                            <FontAwesomeIcon icon={["fab", "markdown"]} />
                                        </ActionIcon>
                                    </Tooltip>
                                </RichTextEditor.ControlsGroup>
                            </Group>
                        </Group>
                    </RichTextEditor.Toolbar>

                    <RichTextEditor.Content className="markdown-content" />
                </RichTextEditor>
            )}
        </Box>
    );
}
