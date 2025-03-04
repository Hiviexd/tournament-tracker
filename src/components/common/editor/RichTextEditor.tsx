import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RichTextEditor as MantineRichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect } from "react";
import SaveIndicator from "./SaveIndicator";
import TableControls from "./TableControls";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSwitchToMarkdown: () => void;
    showSaveIndicator: boolean;
    disabled?: boolean;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
}

/**
 * Rich text editor component
 */
export default function RichTextEditor({
    value,
    onChange,
    onSwitchToMarkdown,
    showSaveIndicator,
    disabled = false,
    placeholder = "Type your content here...",
    minHeight = 200,
    maxHeight,
}: RichTextEditorProps) {
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
            Table.configure({
                resizable: false,
                allowTableNodeSelection: false,
                lastColumnResizable: false,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            // Get the content as markdown and pass it to the onChange handler
            const markdown = editor.storage.markdown.getMarkdown();
            onChange(markdown);
        },
        editable: !disabled,
    });

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (editor && value !== undefined) {
            const currentMarkdown = editor.storage.markdown.getMarkdown();
            if (currentMarkdown !== value) {
                editor.commands.setContent(value);
            }
        }
    }, [editor, value]);

    // Update editor's editable state when disabled prop changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    if (!editor) {
        return null;
    }

    return (
        <MantineRichTextEditor
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
            <MantineRichTextEditor.Toolbar sticky stickyOffset={0}>
                <Group justify="space-between" wrap="nowrap" style={{ width: "100%" }}>
                    <Group wrap="nowrap">
                        <MantineRichTextEditor.ControlsGroup>
                            <MantineRichTextEditor.Bold />
                            <MantineRichTextEditor.Italic />
                            <MantineRichTextEditor.Strikethrough />
                            <MantineRichTextEditor.Code />
                        </MantineRichTextEditor.ControlsGroup>

                        <MantineRichTextEditor.ControlsGroup>
                            <MantineRichTextEditor.H1 />
                            <MantineRichTextEditor.H2 />
                            <MantineRichTextEditor.H3 />
                            <MantineRichTextEditor.H4 />
                        </MantineRichTextEditor.ControlsGroup>

                        <MantineRichTextEditor.ControlsGroup>
                            <MantineRichTextEditor.Blockquote />
                            <MantineRichTextEditor.Hr />
                            <MantineRichTextEditor.BulletList />
                            <MantineRichTextEditor.OrderedList />
                            <MantineRichTextEditor.CodeBlock />
                        </MantineRichTextEditor.ControlsGroup>

                        <MantineRichTextEditor.ControlsGroup>
                            <MantineRichTextEditor.Link />
                            <MantineRichTextEditor.Unlink />
                        </MantineRichTextEditor.ControlsGroup>

                        <TableControls editor={editor} disabled={disabled} />
                    </Group>

                    <Group gap="xs">
                        <SaveIndicator isVisible={showSaveIndicator} />
                        <MantineRichTextEditor.ControlsGroup>
                            <Tooltip label="Markdown Mode" position="bottom">
                                <ActionIcon
                                    variant="default"
                                    onClick={onSwitchToMarkdown}
                                    disabled={disabled}
                                    aria-label="Toggle markdown mode">
                                    <FontAwesomeIcon icon={["fab", "markdown"]} />
                                </ActionIcon>
                            </Tooltip>
                        </MantineRichTextEditor.ControlsGroup>
                    </Group>
                </Group>
            </MantineRichTextEditor.Toolbar>

            <MantineRichTextEditor.Content className="markdown-content" />
        </MantineRichTextEditor>
    );
}
