import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RichTextEditor } from "@mantine/tiptap";

interface TableControlsProps {
    editor: any;
    disabled: boolean;
}

/**
 * Table controls component for the rich text editor
 * Provides buttons for creating and manipulating tables with consistent styling
 */
export default function TableControls({ editor, disabled }: TableControlsProps) {
    if (!editor) return null;

    return (
        <RichTextEditor.ControlsGroup>
            {/* Insert table button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                aria-label="Insert table"
                title="Insert table"
                disabled={disabled}>
                <FontAwesomeIcon icon="table" size="sm" />
            </RichTextEditor.Control>

            {/* Add column before button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                aria-label="Add column before"
                title="Add column before"
                disabled={disabled || !editor.can().addColumnBefore()}>
                <FontAwesomeIcon icon="plus" size="sm" />
            </RichTextEditor.Control>

            {/* Add column after button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                aria-label="Add column after"
                title="Add column after"
                disabled={disabled || !editor.can().addColumnAfter()}>
                <FontAwesomeIcon icon="plus" size="sm" />
            </RichTextEditor.Control>

            {/* Delete column button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().deleteColumn().run()}
                aria-label="Delete column"
                title="Delete column"
                disabled={disabled || !editor.can().deleteColumn()}>
                <FontAwesomeIcon icon="trash" size="sm" />
            </RichTextEditor.Control>

            {/* Add row before button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().addRowBefore().run()}
                aria-label="Add row before"
                title="Add row before"
                disabled={disabled || !editor.can().addRowBefore()}>
                <FontAwesomeIcon icon="plus" size="sm" />
            </RichTextEditor.Control>

            {/* Add row after button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().addRowAfter().run()}
                aria-label="Add row after"
                title="Add row after"
                disabled={disabled || !editor.can().addRowAfter()}>
                <FontAwesomeIcon icon="plus" size="sm" />
            </RichTextEditor.Control>

            {/* Delete row button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().deleteRow().run()}
                aria-label="Delete row"
                title="Delete row"
                disabled={disabled || !editor.can().deleteRow()}>
                <FontAwesomeIcon icon="trash" size="sm" />
            </RichTextEditor.Control>

            {/* Delete table button */}
            <RichTextEditor.Control
                onClick={() => editor.chain().focus().deleteTable().run()}
                aria-label="Delete table"
                title="Delete table"
                disabled={disabled || !editor.can().deleteTable()}>
                <FontAwesomeIcon icon="trash" size="sm" />
            </RichTextEditor.Control>
        </RichTextEditor.ControlsGroup>
    );
}
