import { ActionIcon, Box, Group, Text, Textarea, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import AutoSaveBadge from "../badges/AutoSaveBadge";

interface MarkdownEditorProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSwitchToRichText: () => void;
    showSaveIndicator: boolean;
    disabled?: boolean;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
}

/**
 * Markdown editor component
 */
export default function MarkdownEditor({
    value,
    onChange,
    onSwitchToRichText,
    showSaveIndicator,
    disabled = false,
    placeholder = "Enter markdown text...",
    minHeight = 200,
    maxHeight,
}: MarkdownEditorProps) {
    // Calculate approximate number of rows based on minHeight
    // Assuming average line height of 20px
    const approximateMinRows = Math.max(3, Math.floor((minHeight - 42) / 20));

    return (
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
                            <Link to="/markdown" style={{ fontSize: "12px" }} target="_blank" rel="noopener noreferrer">
                                (guide)
                            </Link>
                        </Text>
                        <AutoSaveBadge isVisible={showSaveIndicator} />
                    </Group>
                    <Tooltip label="Rich Text Mode" position="bottom">
                        <ActionIcon
                            variant="default"
                            onClick={onSwitchToRichText}
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
                value={value}
                onChange={onChange}
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
    );
}
