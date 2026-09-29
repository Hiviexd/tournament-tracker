import { useState } from "react";
import { ActionIcon, Button, Divider, Group, HoverCard, SimpleGrid, Stack, Tooltip, UnstyledButton } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
    faBold,
    faCode,
    faEye,
    faFileCode,
    faImage,
    faItalic,
    faLink,
    faListOl,
    faListUl,
    faMinus,
    faPenToSquare,
    faQuoteLeft,
    faStrikethrough,
    faTable,
    faTableColumns,
} from "@fortawesome/free-solid-svg-icons";
import AutoSaveBadge from "../badges/AutoSaveBadge";
import {
    createTable,
    insert,
    insertImage,
    insertPlaceholder,
    prefixLines,
    wrap,
} from "./markdownEdit";
import { type EditMaker, type ViewMode } from "./useTextEditor";

const toolbarIcon = {
    variant: "subtle" as const,
    color: "primary",
    size: "md" as const,
    // The theme lifts action icons on hover, which the editor's overflow clips.
    styles: { root: { "&:hover": { transform: "none" } } },
};

const viewIcon = {
    write: faPenToSquare,
    preview: faEye,
    split: faTableColumns,
};

const viewLabel = {
    write: "Write",
    preview: "Preview",
    split: "Split",
};

function keepSelection(event: { preventDefault: () => void }) {
    event.preventDefault();
}

function ToolbarButton({
    label,
    icon,
    onClick,
    disabled,
    href,
}: {
    label: string;
    icon: IconProp;
    onClick?: () => void;
    disabled?: boolean;
    href?: string;
}) {
    const shared = {
        ...toolbarIcon,
        "aria-label": label,
        disabled,
    };

    const control = href ? (
        <ActionIcon component="a" href={href} target="_blank" rel="noopener noreferrer" {...shared}>
            <FontAwesomeIcon icon={icon} size="sm" />
        </ActionIcon>
    ) : (
        <ActionIcon type="button" onMouseDown={keepSelection} onClick={onClick} {...shared}>
            <FontAwesomeIcon icon={icon} size="sm" />
        </ActionIcon>
    );

    return (
        <Tooltip label={label} openDelay={0}>
            {control}
        </Tooltip>
    );
}

interface EditorToolbarProps {
    disabled: boolean;
    showAutoSave: boolean;
    saveVisible: boolean;
    nextView: ViewMode;
    onNextView: () => void;
    rememberSelection: () => void;
    run: (make: EditMaker) => () => void;
    editSelection: (make: EditMaker) => void;
}

export default function EditorToolbar({
    disabled,
    showAutoSave,
    saveVisible,
    nextView,
    onNextView,
    rememberSelection,
    run,
    editSelection,
}: EditorToolbarProps) {
    const [headingCardKey, setHeadingCardKey] = useState(0);
    const [tableCardKey, setTableCardKey] = useState(0);
    const [tableHover, setTableHover] = useState({ columns: 0, rows: 0 });

    const applyHeading = (level: number) => {
        run((current, start, end) => prefixLines(current, start, end, `${"#".repeat(level)} `))();
        setHeadingCardKey((key) => key + 1);
    };

    const placeTable = (columns: number, rows: number) => {
        editSelection((current, start, end) => insert(current, start, end, createTable(columns, rows)));
        setTableHover({ columns: 0, rows: 0 });
        setTableCardKey((key) => key + 1);
    };

    const holdSelection = (event: { preventDefault: () => void }) => {
        rememberSelection();
        keepSelection(event);
    };

    return (
        <Group
            justify="space-between"
            align="center"
            wrap="wrap"
            gap="xs"
            px="sm"
            py="xs"
            bg="primary.10"
            style={{ borderBottom: "1px solid var(--mantine-color-primary-5)" }}>
            <Group gap="xs" wrap="wrap" align="stretch">
                <Group gap={6} wrap="nowrap" align="center">
                    <HoverCard
                        key={headingCardKey}
                        position="bottom-start"
                        withinPortal
                        shadow="md"
                        offset={6}
                        withArrow
                        arrowOffset={22}
                        disabled={disabled}>
                        <HoverCard.Target>
                            <Tooltip label="Heading" openDelay={0}>
                                <ActionIcon
                                    type="button"
                                    {...toolbarIcon}
                                    aria-label="Heading"
                                    disabled={disabled}
                                    onMouseDown={holdSelection}>
                                    H
                                </ActionIcon>
                            </Tooltip>
                        </HoverCard.Target>
                        <HoverCard.Dropdown p="xs" bg="primary.10">
                            <Stack gap={2}>
                                {[1, 2, 3, 4].map((level) => (
                                    <Button
                                        key={level}
                                        type="button"
                                        variant="subtle"
                                        color="primary"
                                        size="compact-sm"
                                        justify="flex-start"
                                        fullWidth
                                        fw={700}
                                        onMouseDown={keepSelection}
                                        onClick={() => applyHeading(level)}>
                                        H{level}
                                    </Button>
                                ))}
                            </Stack>
                        </HoverCard.Dropdown>
                    </HoverCard>
                    <ToolbarButton
                        label="Bold (Ctrl+B)"
                        icon={faBold}
                        disabled={disabled}
                        onClick={run((current, start, end) => wrap(current, start, end, "**"))}
                    />
                    <ToolbarButton
                        label="Italic (Ctrl+I)"
                        icon={faItalic}
                        disabled={disabled}
                        onClick={run((current, start, end) => wrap(current, start, end, "*"))}
                    />
                    <ToolbarButton
                        label="Strikethrough"
                        icon={faStrikethrough}
                        disabled={disabled}
                        onClick={run((current, start, end) => wrap(current, start, end, "~~"))}
                    />
                </Group>
                <Divider orientation="vertical" color="primary.5" />
                <Group gap={6} wrap="nowrap" align="center">
                    <ToolbarButton
                        label="Bullet list"
                        icon={faListUl}
                        disabled={disabled}
                        onClick={run((current, start, end) => prefixLines(current, start, end, "- "))}
                    />
                    <ToolbarButton
                        label="Numbered list"
                        icon={faListOl}
                        disabled={disabled}
                        onClick={run((current, start, end) => prefixLines(current, start, end, "1. "))}
                    />
                    <ToolbarButton
                        label="Quote"
                        icon={faQuoteLeft}
                        disabled={disabled}
                        onClick={run((current, start, end) => prefixLines(current, start, end, "> "))}
                    />
                </Group>
                <Divider orientation="vertical" color="primary.5" />
                <Group gap={6} wrap="nowrap" align="center">
                    <ToolbarButton
                        label="Inline code"
                        icon={faCode}
                        disabled={disabled}
                        onClick={run((current, start, end) => wrap(current, start, end, "`"))}
                    />
                    <ToolbarButton
                        label="Code block"
                        icon={faFileCode}
                        disabled={disabled}
                        onClick={run((current, start, end) => wrap(current, start, end, "```\n", "\n```"))}
                    />
                </Group>
                <Divider orientation="vertical" color="primary.5" />
                <Group gap={6} wrap="nowrap" align="center">
                    <ToolbarButton
                        label="Link (Ctrl+V on selection)"
                        icon={faLink}
                        disabled={disabled}
                        onClick={run((current, start, end) => insertPlaceholder(current, start, end, "[", "TEXT", "](LINK)", "LINK"))}
                    />
                    <ToolbarButton label="Image" icon={faImage} disabled={disabled} onClick={run(insertImage)} />
                    <ToolbarButton
                        label="Horizontal rule"
                        icon={faMinus}
                        disabled={disabled}
                        onClick={run((current, start, end) => insert(current, start, end, "\n---\n"))}
                    />
                    <HoverCard
                        key={tableCardKey}
                        position="bottom-start"
                        withinPortal
                        shadow="md"
                        offset={6}
                        withArrow
                        arrowOffset={18}
                        disabled={disabled}>
                        <HoverCard.Target>
                            <Tooltip label="Table" openDelay={0}>
                                <ActionIcon
                                    type="button"
                                    {...toolbarIcon}
                                    aria-label="Table"
                                    disabled={disabled}
                                    onMouseDown={holdSelection}>
                                    <FontAwesomeIcon icon={faTable} size="sm" />
                                </ActionIcon>
                            </Tooltip>
                        </HoverCard.Target>
                        <HoverCard.Dropdown p="xs" bg="primary.10">
                            <SimpleGrid cols={6} spacing={4} onMouseLeave={() => setTableHover({ columns: 0, rows: 0 })}>
                                {Array.from({ length: 6 }, (_, row) =>
                                    Array.from({ length: 6 }, (_, column) => {
                                        const columns = column + 1;
                                        const rows = row + 1;
                                        const active = columns <= tableHover.columns && rows <= tableHover.rows;
                                        const border = active
                                            ? "var(--mantine-color-primary-5)"
                                            : "var(--mantine-color-default-border)";
                                        return (
                                            <UnstyledButton
                                                key={`${rows}-${columns}`}
                                                w={18}
                                                h={18}
                                                bg={active ? "primary.5" : "primary.10"}
                                                bd={`1px solid ${border}`}
                                                bdrs={2}
                                                aria-label={`${columns} by ${rows} table`}
                                                onMouseDown={keepSelection}
                                                onMouseEnter={() => setTableHover({ columns, rows })}
                                                onClick={() => placeTable(columns, rows)}
                                            />
                                        );
                                    }),
                                )}
                            </SimpleGrid>
                        </HoverCard.Dropdown>
                    </HoverCard>
                </Group>
            </Group>
            <Group gap={6} wrap="nowrap" align="center">
                {showAutoSave && <AutoSaveBadge isVisible={saveVisible} />}
                <ToolbarButton label="Markdown guide" icon={["fab", "markdown"]} href="/markdown" />
                <ToolbarButton label={viewLabel[nextView]} icon={viewIcon[nextView]} onClick={onNextView} />
            </Group>
        </Group>
    );
}
