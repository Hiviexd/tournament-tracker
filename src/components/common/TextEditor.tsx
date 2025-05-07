import { useEffect, useRef } from "react";
import MdEditor, { Plugins } from "react-markdown-editor-lite";
import MarkdownText from "./MarkdownText";
import { useAutoSave } from "../../hooks/useAutoSave";
import "react-markdown-editor-lite/lib/index.css";
import AutoSaveBadge from "./badges/AutoSaveBadge";
import MarkdownGuidePlugin from "./editor/MarkdownGuidePlugin";

function getEditorDomId(autoSaveKey?: string) {
    if (autoSaveKey) return `editor-${autoSaveKey}`;
    // fallback: random id
    return `editor-${Math.random().toString(36).slice(2, 10)}`;
}

interface IProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    className?: string;
    disabled?: boolean;
    autoSaveKey?: string;
    style?: React.CSSProperties;
    allowHtml?: boolean;
}

export default function TextEditor({
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
}: IProps) {
    const isAutoSaveEnabled = !!autoSaveKey;
    const {
        value: autoSavedValue,
        setValue: setAutoSavedValue,
        isSaved: autoSaveIsSaved,
        isTyping: autoSaveIsTyping,
    } = useAutoSave({
        key: autoSaveKey || "temp-editor-key",
        initialValue: value,
    });

    const editorValue = isAutoSaveEnabled ? autoSavedValue : value;

    const handleChange = (content: { text: string }) => {
        if (isAutoSaveEnabled) {
            setAutoSavedValue(content.text);
        }
        onChange(content.text);
    };

    // Disable plugins
    MdEditor.unuse(Plugins.FontUnderline);
    MdEditor.unuse(Plugins.FullScreen);

    // Auto resize plugin
    MdEditor.use(Plugins.AutoResize, {
        min: minHeight,
        max: maxHeight,
    });

    // Markdown guide plugin
    MdEditor.use(MarkdownGuidePlugin);

    // Show save indicator when content is saved and not typing
    const showSaveIndicator = isAutoSaveEnabled && autoSaveIsSaved && !autoSaveIsTyping;

    // Generate a unique id for this editor instance
    const editorDomId = useRef(getEditorDomId(autoSaveKey));

    // Add autosave badge via DOM injection, scoped to this editor instance
    const badgeRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const toolbar = document.querySelector(
            `#${editorDomId.current} .rc-md-navigation .navigation-nav.right .button-wrap`
        );
        if (toolbar && badgeRef.current && !toolbar.contains(badgeRef.current)) {
            toolbar.insertBefore(badgeRef.current, toolbar.firstChild);
        }
    });

    return (
        <div id={editorDomId.current}>
            <span ref={badgeRef}>
                <AutoSaveBadge isVisible={showSaveIndicator} />
            </span>

            <MdEditor
                value={editorValue}
                style={{
                    minHeight,
                    ...(maxHeight ? { maxHeight } : {}),
                    ...style,
                }}
                className={className}
                htmlClass="markdown-content"
                renderHTML={(text) => <MarkdownText content={text} allowHtml={allowHtml} />}
                onChange={handleChange}
                placeholder={placeholder}
                readOnly={disabled}
                view={{
                    menu: true,
                    md: true,
                    html: false,
                }}
                canView={{
                    menu: true,
                    md: true,
                    html: true,
                    both: true,
                    fullScreen: false,
                    hideMenu: false,
                }}
            />
        </div>
    );
}
