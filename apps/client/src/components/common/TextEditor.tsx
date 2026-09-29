import { type CSSProperties, type Ref } from "react";
import { Box, SimpleGrid } from "@mantine/core";
import MarkdownText from "./MarkdownText";
import { useAutoSave } from "../../hooks/useAutoSave";
import EditorToolbar from "./editor/EditorToolbar";
import { useTextEditor, type TextEditorRef } from "./editor/useTextEditor";

export type { TextEditorRef };

interface IProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    className?: string;
    disabled?: boolean;
    autoSaveKey?: string;
    style?: CSSProperties;
    allowHtml?: boolean;
    ref?: Ref<TextEditorRef>;
}

interface EditorSurfaceProps extends Omit<IProps, "autoSaveKey" | "placeholder" | "minHeight" | "maxHeight" | "disabled" | "allowHtml"> {
    placeholder: string;
    minHeight: number;
    maxHeight: number;
    disabled: boolean;
    allowHtml: boolean;
    showAutoSave: boolean;
    saveVisible: boolean;
}

function EditorSurface({
    ref,
    value,
    onChange,
    placeholder,
    minHeight,
    maxHeight,
    className,
    disabled,
    style,
    allowHtml,
    showAutoSave,
    saveVisible,
}: EditorSurfaceProps) {
    const editor = useTextEditor({ ref, value, onChange, disabled, minHeight, maxHeight });
    const invalid = className?.split(/\s+/).includes("error");
    const border = invalid ? "var(--mantine-color-red-filled)" : "var(--mantine-color-default-border)";

    return (
        <Box className={className} bg="primary.10" bdrs="sm" bd={`1px solid ${border}`} style={{ overflow: "hidden", ...style }}>
            <EditorToolbar
                disabled={disabled}
                showAutoSave={showAutoSave}
                saveVisible={saveVisible}
                nextView={editor.nextView}
                onNextView={() => editor.setView(editor.nextView)}
                rememberSelection={editor.rememberSelection}
                run={editor.run}
                editSelection={editor.editSelection}
            />
            <SimpleGrid
                cols={editor.view === "split" ? { base: 1, sm: 2 } : 1}
                spacing={0}
                verticalSpacing={0}
                bg="primary.11"
                mih={minHeight}
                pos="relative">
                <textarea
                    ref={editor.textareaRef}
                    className="text-editor-input"
                    defaultValue={value}
                    style={editor.inputStyle}
                    placeholder={placeholder}
                    readOnly={disabled}
                    tabIndex={editor.view === "preview" ? -1 : undefined}
                    aria-hidden={editor.view === "preview" || undefined}
                    onInput={editor.onInput}
                    onKeyDown={editor.onKeyDown}
                    onPaste={editor.onPaste}
                    onSelect={editor.rememberSelection}
                    onKeyUp={editor.rememberSelection}
                    onMouseUp={editor.rememberSelection}
                    onBlur={editor.rememberSelection}
                />
                {editor.view !== "write" && (
                    <Box
                        ref={editor.previewRef}
                        className={editor.view === "split" ? "text-editor-preview-split" : undefined}
                        mih={minHeight}
                        mah={maxHeight}
                        miw={0}
                        p="md"
                        bg="primary.11"
                        style={{ overflow: "auto", boxSizing: "border-box" }}>
                        <MarkdownText content={value} allowHtml={allowHtml} />
                    </Box>
                )}
            </SimpleGrid>
        </Box>
    );
}

function AutosaveTextEditor({
    autoSaveKey,
    value,
    onChange,
    ...rest
}: EditorSurfaceProps & { autoSaveKey: string }) {
    // Read once. Feeding later parent `value` changes back in would replace a restored draft.
    const { value: savedValue, setValue, isSaved, isTyping } = useAutoSave({
        key: autoSaveKey,
        initialValue: value,
    });

    return (
        <EditorSurface
            {...rest}
            value={savedValue}
            onChange={(next) => {
                setValue(next);
                onChange(next);
            }}
            showAutoSave
            saveVisible={isSaved && !isTyping}
        />
    );
}

function TextEditor({
    value,
    onChange,
    placeholder = "Type your content here...",
    minHeight = 200,
    maxHeight = 600,
    className,
    disabled = false,
    autoSaveKey,
    style,
    allowHtml = false,
    ref,
}: IProps) {
    const surfaceProps: EditorSurfaceProps = {
        ref,
        value,
        onChange,
        placeholder,
        minHeight,
        maxHeight,
        className,
        disabled,
        style,
        allowHtml,
        showAutoSave: false,
        saveVisible: false,
    };

    if (autoSaveKey) {
        return <AutosaveTextEditor {...surfaceProps} autoSaveKey={autoSaveKey} />;
    }

    return <EditorSurface {...surfaceProps} />;
}

export default TextEditor;
