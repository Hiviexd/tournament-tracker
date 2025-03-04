import { Box } from "@mantine/core";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useEditorPreferences } from "../../hooks/useEditorPreferences";
import { MarkdownEditor, RichTextEditor } from "./editor";

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

/**
 * TextEditor component that provides a rich text editor with markdown support and optional autosave
 */
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
    // Use the editor preferences hook to get and set markdown mode
    const { isMarkdownMode, toggleMarkdownMode } = useEditorPreferences();

    // Setup autosave
    const isAutoSaveEnabled = !!autoSaveKey;
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

    // Use autosaved value if available, otherwise use the provided value
    const editorValue = isAutoSaveEnabled ? autoSavedValue : value;

    // Handle content changes
    const handleChange = (newValue: string) => {
        if (isAutoSaveEnabled) {
            setAutoSavedValue(newValue);
        }
        onChange(newValue);
    };

    // Handle markdown text changes
    const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        handleChange(newValue);
    };

    // Show save indicator when content is saved and not typing
    const showSaveIndicator = isAutoSaveEnabled && autoSaveIsSaved && !autoSaveIsTyping;

    return (
        <Box className={className}>
            {isMarkdownMode ? (
                <MarkdownEditor
                    value={editorValue}
                    onChange={handleMarkdownChange}
                    onSwitchToRichText={toggleMarkdownMode}
                    showSaveIndicator={showSaveIndicator}
                    disabled={disabled}
                    placeholder={placeholder}
                    minHeight={minHeight}
                    maxHeight={maxHeight}
                />
            ) : (
                <RichTextEditor
                    value={editorValue}
                    onChange={handleChange}
                    onSwitchToMarkdown={toggleMarkdownMode}
                    showSaveIndicator={showSaveIndicator}
                    disabled={disabled}
                    placeholder={placeholder}
                    minHeight={minHeight}
                    maxHeight={maxHeight}
                />
            )}
        </Box>
    );
}
