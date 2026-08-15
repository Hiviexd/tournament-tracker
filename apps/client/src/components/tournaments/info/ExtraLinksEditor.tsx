import {
    Stack,
    Group,
    Text,
    ActionIcon,
    Box,
    TextInput,
    Combobox,
    InputBase,
    useCombobox,
    Tooltip,
} from "@mantine/core";
import { ITournamentExtraLink, ExtraLinkType } from "@tc/types/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, Fragment } from "react";
import utils, { pickStringUnion } from "@tc/utils/client";
import { notifications } from "@mantine/notifications";
import { EXTRA_LINK_DEFAULTS, EXTRA_LINK_FA_ICONS, EXTRA_LINK_SVG_ICONS, EXTRA_LINK_TYPES } from "@tc/utils/extraLinks";

const ICON_PX = { xs: 12, sm: 14 } as const;

const typeSelectData = EXTRA_LINK_TYPES.map((type) => ({
    value: type,
    label: EXTRA_LINK_DEFAULTS[type],
}));

export function ExtraLinkTypeIcon({ type, size = "sm" }: { type: ExtraLinkType; size?: "sm" | "xs" }) {
    const svgSrc = EXTRA_LINK_SVG_ICONS[type];
    const px = ICON_PX[size];
    const label = EXTRA_LINK_DEFAULTS[type];

    let iconContent: React.ReactNode;

    if (svgSrc) {
        iconContent = (
            <Box
                w={px}
                h={px}
                style={{
                    flexShrink: 0,
                    backgroundColor: "currentColor",
                    mask: `url(${svgSrc}) center / contain no-repeat`,
                    WebkitMask: `url(${svgSrc}) center / contain no-repeat`,
                }}
            />
        );
    } else {
        const icon = EXTRA_LINK_FA_ICONS[type];
        if (!icon) return null;
        iconContent = <FontAwesomeIcon icon={icon} size={size} fixedWidth />;
    }

    return (
        <Tooltip label={label}>
            <Box component="span" style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}>
                {iconContent}
            </Box>
        </Tooltip>
    );
}

function ExtraLinkTypeSelect({ value, onChange }: { value: ExtraLinkType; onChange: (type: ExtraLinkType) => void }) {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    return (
        <Combobox
            store={combobox}
            position="bottom-start"
            width="auto"
            withinPortal
            transitionProps={{ transition: "fade", duration: 150 }}
            onOptionSubmit={(type) => {
                const next = pickStringUnion(type, EXTRA_LINK_TYPES);
                if (next) onChange(next);
                combobox.closeDropdown();
            }}>
            <Combobox.Target>
                <InputBase
                    component="button"
                    type="button"
                    pointer
                    rightSection={<Combobox.Chevron />}
                    rightSectionPointerEvents="none"
                    onClick={() => combobox.toggleDropdown()}
                    w={70}
                    styles={{
                        section: {
                            color: "var(--mantine-color-dimmed)",
                        },
                        input: {
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            paddingLeft: "var(--mantine-spacing-xs)",
                            paddingRight: "var(--mantine-spacing-xs)",
                            color: "var(--mantine-color-dimmed)",
                        },
                    }}>
                    <Box component="span" style={{ pointerEvents: "none", display: "flex", alignItems: "center" }}>
                        <ExtraLinkTypeIcon type={value} />
                    </Box>
                </InputBase>
            </Combobox.Target>

            <Combobox.Dropdown>
                <Combobox.Options>
                    {typeSelectData.map(({ value: type, label }) => (
                        <Combobox.Option value={type} key={type}>
                            <Group gap="xs" wrap="nowrap">
                                <ExtraLinkTypeIcon type={type} />
                                <Text size="sm">{label}</Text>
                            </Group>
                        </Combobox.Option>
                    ))}
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}

function createDraftRow(type: ExtraLinkType = "news") {
    return {
        type,
        name: EXTRA_LINK_DEFAULTS[type],
        url: "",
    };
}

interface ExtraLinksEditorProps {
    value: ITournamentExtraLink[];
    onChange: (links: ITournamentExtraLink[]) => void;
}

export default function ExtraLinksEditor({ value, onChange }: ExtraLinksEditorProps) {
    const [draftRow, setDraftRow] = useState(createDraftRow());

    const handleTypeChange = (newType: ExtraLinkType) => {
        setDraftRow((prev) => ({
            ...prev,
            type: newType,
            name: prev.name === EXTRA_LINK_DEFAULTS[prev.type] ? EXTRA_LINK_DEFAULTS[newType] : prev.name,
        }));
    };

    const handleAdd = () => {
        const entry: ITournamentExtraLink = {
            type: draftRow.type,
            name: draftRow.name.trim(),
            url: draftRow.url.trim(),
        };

        const error = utils.validateExtraLink(entry);
        if (error) {
            notifications.show({
                title: "Invalid link",
                message: error,
                color: "red",
            });
            return;
        }

        onChange([...value, entry]);
        setDraftRow(createDraftRow(draftRow.type));
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <Stack gap="xs">
            <Group align="center" wrap="nowrap" w="100%">
                <ExtraLinkTypeSelect value={draftRow.type} onChange={handleTypeChange} />
                <TextInput
                    value={draftRow.name}
                    onChange={(event) => {
                        const name = event.currentTarget.value;
                        setDraftRow((prev) => ({ ...prev, name }));
                    }}
                    placeholder="Name"
                    style={{ flex: 1 }}
                />
                <TextInput
                    value={draftRow.url}
                    onChange={(event) => {
                        const url = event.currentTarget.value;
                        setDraftRow((prev) => ({ ...prev, url }));
                    }}
                    placeholder="URL"
                    style={{ flex: 2 }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            handleAdd();
                        }
                    }}
                />
                <ActionIcon type="button" variant="subtle" onClick={handleAdd} color="success" title="Add link">
                    <FontAwesomeIcon icon="plus" />
                </ActionIcon>
            </Group>

            {value.length > 0 && (
                <Box
                    style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        columnGap: "var(--mantine-spacing-xs)",
                        rowGap: 4,
                        alignItems: "center",
                    }}>
                    {value.map((link, index) => (
                        <Fragment key={`${link.type}-${link.url}-${index}`}>
                            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                <ExtraLinkTypeIcon type={link.type} />
                                <Text size="sm" fw={500} lineClamp={1}>
                                    {link.name}
                                </Text>
                            </Group>
                            <Text size="sm" c="dimmed" lineClamp={1} style={{ minWidth: 0 }}>
                                {link.url}
                            </Text>
                            <ActionIcon
                                type="button"
                                variant="subtle"
                                onClick={() => handleRemove(index)}
                                color="danger"
                                title="Remove link">
                                <FontAwesomeIcon icon="minus" />
                            </ActionIcon>
                        </Fragment>
                    ))}
                </Box>
            )}
        </Stack>
    );
}
