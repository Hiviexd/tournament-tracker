import { useImperativeHandle, useLayoutEffect, useRef, useState, type ClipboardEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type Ref } from "react";
import {
    indentLines,
    insert,
    insertedText,
    isHttpUrl,
    outdentLines,
    selectionInLinkOrImage,
    wrap,
    type RangeEdit,
} from "./markdownEdit";

export interface TextEditorRef {
    insertText: (text: string) => void;
    focus: () => void;
}

export const viewModes = ["write", "preview", "split"] as const;

export type ViewMode = (typeof viewModes)[number];

export type EditMaker = (current: string, start: number, end: number) => RangeEdit;

interface UseTextEditorOptions {
    ref?: Ref<TextEditorRef>;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    minHeight: number;
    maxHeight: number;
}

function editorInputStyle(view: ViewMode, minHeight: number, maxHeight: number, disabled: boolean): CSSProperties {
    const preview = view === "preview";
    const style: CSSProperties = {
        flex: "1 1 auto",
        width: preview ? 1 : "100%",
        minWidth: 0,
        minHeight: preview ? 0 : minHeight,
        maxHeight: preview ? "none" : maxHeight,
        height: preview ? 1 : undefined,
        margin: 0,
        padding: preview ? 0 : "1rem",
        border: 0,
        outline: "none",
        boxSizing: "border-box",
        resize: preview ? "none" : "vertical",
        background: disabled ? "var(--mantine-color-primary-10)" : "var(--mantine-color-primary-11)",
        color: disabled ? "var(--mantine-color-gray-6)" : "var(--mantine-color-text)",
        fontFamily: "inherit",
        fontSize: "1rem",
        cursor: disabled ? "not-allowed" : undefined,
    };
    if (preview) {
        style.position = "absolute";
        style.overflow = "hidden";
        style.opacity = 0;
    }
    return style;
}

export function useTextEditor({ ref, value, onChange, disabled, minHeight, maxHeight }: UseTextEditorOptions) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const emittedRef = useRef(value);
    const onChangeRef = useRef(onChange);
    const disabledRef = useRef(disabled);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [view, setView] = useState<ViewMode>("write");

    onChangeRef.current = onChange;
    disabledRef.current = disabled;

    const publish = (next: string) => {
        emittedRef.current = next;
        onChangeRef.current(next);
    };

    const rememberSelection = () => {
        const el = textareaRef.current;
        if (!el) return;
        selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
    };

    const apply = (edit: RangeEdit, original: string) => {
        const el = textareaRef.current;
        if (!el || disabledRef.current) return;

        const text = insertedText(edit, original.length);
        el.focus({ preventScroll: true });
        el.setSelectionRange(edit.replaceStart, edit.replaceEnd);

        let applied = false;
        try {
            // execCommand keeps the edit on the textarea's native undo stack.
            applied = text.length === 0 ? document.execCommand("delete") : document.execCommand("insertText", false, text);
        } catch {
            applied = false;
        }

        if (!applied || el.value !== edit.next) {
            el.value = edit.next;
        }
        if (emittedRef.current !== edit.next) {
            publish(edit.next);
        }
        el.setSelectionRange(edit.selectionStart, edit.selectionEnd);
        rememberSelection();
    };

    const editSelection = (make: EditMaker) => {
        const el = textareaRef.current;
        if (!el || disabledRef.current) return;
        const focused = document.activeElement === el;
        const start = focused ? el.selectionStart : selectionRef.current.start;
        const end = focused ? el.selectionEnd : selectionRef.current.end;
        apply(make(el.value, start, end), el.value);
    };

    const editSelectionRef = useRef(editSelection);
    editSelectionRef.current = editSelection;

    useImperativeHandle(
        ref,
        () => ({
            insertText: (text: string) => {
                editSelectionRef.current((current, start, end) => insert(current, start, end, text));
            },
            focus: () => {
                setView((current) => (current === "preview" ? "write" : current));
                requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
            },
        }),
        [],
    );

    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el || value === emittedRef.current || el.value === value) return;
        el.value = value;
        emittedRef.current = value;
    }, [value]);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        const preview = previewRef.current;
        // Match react-markdown-editor-lite's auto-resize: grow with the content, clamped to min/max.
        const measure = (node: HTMLElement) => {
            const previousMax = node.style.maxHeight;
            node.style.maxHeight = "none";
            node.style.height = "auto";
            const height = Math.min(Math.max(minHeight, node.scrollHeight), maxHeight);
            node.style.maxHeight = previousMax;
            return height;
        };

        if (view !== "preview" && textarea) {
            const height = measure(textarea);
            textarea.style.height = `${height}px`;
            if (preview) preview.style.height = `${height}px`;
            return;
        }

        if (textarea) textarea.style.height = "";
        if (preview) preview.style.height = `${measure(preview)}px`;
    }, [value, view, minHeight, maxHeight]);

    const run = (make: EditMaker) => () => {
        editSelection(make);
    };

    const onInput = (event: FormEvent<HTMLTextAreaElement>) => {
        publish(event.currentTarget.value);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (disabled) return;
        const el = event.currentTarget;
        if (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            const original = el.value;
            const make = event.shiftKey ? outdentLines : indentLines;
            apply(make(original, el.selectionStart, el.selectionEnd), original);
            return;
        }
        if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
        const key = event.key.toLowerCase();
        if (key !== "b" && key !== "i") return;
        event.preventDefault();
        const original = el.value;
        apply(wrap(original, el.selectionStart, el.selectionEnd, key === "b" ? "**" : "*"), original);
    };

    const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        if (disabled) return;
        const el = event.currentTarget;
        if (el.selectionStart === el.selectionEnd) return;
        const pasted = event.clipboardData.getData("text").trim();
        if (!pasted || !isHttpUrl(pasted)) return;
        if (selectionInLinkOrImage(el.value, el.selectionStart, el.selectionEnd)) return;
        event.preventDefault();
        const original = el.value;
        apply(wrap(original, el.selectionStart, el.selectionEnd, "[", `](${pasted})`), original);
    };

    return {
        textareaRef,
        previewRef,
        view,
        nextView: viewModes[(viewModes.indexOf(view) + 1) % viewModes.length],
        setView,
        rememberSelection,
        run,
        editSelection,
        inputStyle: editorInputStyle(view, minHeight, maxHeight, disabled),
        onInput,
        onKeyDown,
        onPaste,
    };
}
