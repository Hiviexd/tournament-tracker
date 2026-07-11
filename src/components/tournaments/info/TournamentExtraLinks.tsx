import { Stack, Group, Text, ActionIcon, Box, TextInput, Anchor, Combobox, InputBase, useCombobox, Tooltip } from "@mantine/core";
import { ITournament, ITournamentExtraLink, ExtraLinkType } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useEditTournament } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import utils from "../../../../utils";
import { notifications } from "@mantine/notifications";
import {
    EXTRA_LINK_DEFAULTS,
    EXTRA_LINK_FA_ICONS,
    EXTRA_LINK_SVG_ICONS,
    EXTRA_LINK_TYPES,
} from "../../../../utils/extraLinks";

interface IProps {
    tournament: ITournament;
}

const ICON_PX = { xs: 12, sm: 14 } as const;

const typeSelectData = EXTRA_LINK_TYPES.map((type) => ({
    value: type,
    label: EXTRA_LINK_DEFAULTS[type],
}));

function ExtraLinkTypeIcon({ type, size = "sm" }: { type: ExtraLinkType; size?: "sm" | "xs" }) {
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

function ExtraLinkTypeSelect({
    value,
    onChange,
}: {
    value: ExtraLinkType;
    onChange: (type: ExtraLinkType) => void;
}) {
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
                onChange(type as ExtraLinkType);
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

export default function TournamentExtraLinks({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [isEditing, setIsEditing] = useState(false);
    const [draftLinks, setDraftLinks] = useState<ITournamentExtraLink[]>(tournament.extraLinks ?? []);
    const [draftRow, setDraftRow] = useState(createDraftRow());
    const editTournamentMutation = useEditTournament(tournament.id);

    const savedLinks = tournament.extraLinks ?? [];
    const canEdit = !!user?.isCommitteeOrAdmin;

    const handleCancel = () => {
        setIsEditing(false);
        setDraftLinks(savedLinks);
        setDraftRow(createDraftRow());
    };

    const handleStartEdit = () => {
        setDraftLinks(savedLinks);
        setDraftRow(createDraftRow());
        setIsEditing(true);
    };

    const handleTypeChange = (newType: ExtraLinkType) => {
        setDraftRow((prev) => ({
            ...prev,
            type: newType,
            name: prev.name === EXTRA_LINK_DEFAULTS[prev.type] ? EXTRA_LINK_DEFAULTS[newType] : prev.name,
        }));
    };

    const handleAddDraftRow = () => {
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

        setDraftLinks((prev) => [
            ...prev,
            {
                type: entry.type,
                name: entry.name,
                url: entry.url.trim(),
            },
        ]);
        setDraftRow(createDraftRow());
    };

    const handleRemoveDraftLink = (index: number) => {
        setDraftLinks((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const error = utils.validateExtraLinks(draftLinks);
        if (error) {
            notifications.show({
                title: "Invalid links",
                message: error,
                color: "red",
            });
            return;
        }

        await editTournamentMutation.mutateAsync({ extraLinks: draftLinks });
        setIsEditing(false);
        setDraftRow(createDraftRow());
    };

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
                    Extra Links
                </Text>
                {isEditing ? (
                    <Group gap={4}>
                        <ActionIcon variant="subtle" onClick={handleCancel} color="danger" title="Cancel">
                            <FontAwesomeIcon icon="xmark" />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            onClick={handleSave}
                            color="success"
                            title="Save"
                            loading={editTournamentMutation.isPending}>
                            <FontAwesomeIcon icon="save" />
                        </ActionIcon>
                    </Group>
                ) : (
                    canEdit && (
                        <ActionIcon variant="subtle" onClick={handleStartEdit} color="info" title="Edit extra links">
                            <FontAwesomeIcon icon="pen-to-square" />
                        </ActionIcon>
                    )
                )}
            </Group>

            {isEditing ? (
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
                                    handleAddDraftRow();
                                }
                            }}
                        />
                        <ActionIcon variant="subtle" onClick={handleAddDraftRow} color="success" title="Add link">
                            <FontAwesomeIcon icon="plus" />
                        </ActionIcon>
                    </Group>

                    {draftLinks.length > 0 && (
                        <Stack gap={4}>
                            {draftLinks.map((link, index) => (
                                <Group key={`${link.type}-${link.url}-${index}`} gap="xs" wrap="nowrap">
                                    <ExtraLinkTypeIcon type={link.type} />
                                    <Text size="sm" fw={500} lineClamp={1} style={{ minWidth: 80 }}>
                                        {link.name}
                                    </Text>
                                    <Text size="sm" c="dimmed" lineClamp={1} style={{ flex: 1 }}>
                                        {link.url}
                                    </Text>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() => handleRemoveDraftLink(index)}
                                        color="danger"
                                        title="Remove link">
                                        <FontAwesomeIcon icon="minus" />
                                    </ActionIcon>
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Stack>
            ) : (
                <Box>
                    {savedLinks.length > 0 ? (
                        <Stack gap={4}>
                            {savedLinks.map((link, index) => (
                                <Group key={`${link.type}-${link.url}-${index}`} gap="xs" wrap="nowrap">
                                    <ExtraLinkTypeIcon type={link.type} />
                                    <Text size="sm" fw={500}>
                                        <Anchor href={link.url} target="_blank" rel="noopener noreferrer">
                                            {link.name}
                                        </Anchor>
                                    </Text>
                                </Group>
                            ))}
                        </Stack>
                    ) : (
                        <Text size="sm" c="dimmed" fs="italic">
                            No extra links
                        </Text>
                    )}
                </Box>
            )}
        </Stack>
    );
}
