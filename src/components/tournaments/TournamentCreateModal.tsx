import { useMemo, useState } from "react";
import { useCreateTournament } from "../../hooks/useTournaments";
import { Modal, TextInput, Stack, Select, Button, Group, LoadingOverlay, TagsInput, Pill, Text, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DateInput } from "@mantine/dates";
import { GameMode, TournamentType, TournamentStatus } from "../../../interfaces/Tournament";
import MultiSelect from "../common/MultiSelect";
import MultipleUsersInput from "../common/MultipleUsersInput";
import utils from "../../../utils";
import { useNavigate } from "react-router";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

function generateSuggestedTagFromName(name: string): string {
    const letterGroups = name.match(/[A-z]+/g);
    if (!letterGroups || letterGroups.length < 2) return "";

    const matches = name.match(/[A-z]+|\d+/g);
    if (!matches) return "";
    return matches.map((word) => (/\d/.test(word) ? word : word[0])).join("").toUpperCase();
}

export default function TournamentCreateModal({ opened, onClose }: IProps) {
    const createTournamentMutation = useCreateTournament();
    const [selectedHosts, setSelectedHosts] = useState<IUser[]>([]);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: {
            name: "",
            hostIds: [] as string[],
            modes: [] as GameMode[],
            type: "" as TournamentType,
            status: "" as TournamentStatus,
            bannerUrl: "",
            forumUrl: "",
            startDate: null as Date | null,
            endDate: null as Date | null,
            enchantUrl: "",
            tags: [] as string[],
        },
        validate: {
            name: (value) => {
                if (!value) return "Name is required";
                if (!utils.isLatinScriptOnly(value)) return "Name must be in Latin script (no Cyrillic, Chinese, etc.)";
                return null;
            },
            hostIds: (value) => (value.length === 0 ? "At least one host is required" : null),
            modes: (value) => (value.length === 0 ? "At least one game mode is required" : null),
            type: (value) => (!value ? "Type is required" : null),
            forumUrl: (value) => {
                if (value && !utils.isOsuForumLink(value) && !utils.isOsuNewsLink(value)) return "Invalid osu! forum or news URL";
            },
            bannerUrl: (value) => {
                if (value && !utils.isValidUrl(value)) return "Invalid URL";
            },
            enchantUrl: (value) => {
                if (value && !utils.isEnchantTicketLink(value)) return "Invalid Enchant ticket URL";
            },
            startDate: (value) => (!value ? "Start date is required" : null),
            endDate: (value, values) => {
                if (!value) return "End date is required";
                if (values.startDate && value < values.startDate) {
                    return "End date must be after start date";
                }
                return null;
            },
        },
    });

    const handleHostsChange = (hosts: IUser[]) => {
        setSelectedHosts(hosts);
        form.setFieldValue(
            "hostIds",
            hosts.map((h) => h.id)
        );
    };

    const handleSubmit = async (values) => {
        try {
            const res = await createTournamentMutation.mutateAsync(values);
            form.reset();
            setSelectedHosts([]);
            onClose();
            navigate(`/tournaments/${res.tournament._id}`);
        } catch (error) {
            console.error("Failed to create tournament:", error);
        }
    };

    const modeOptions = [
        { value: "osu", label: "osu!" },
        { value: "taiko", label: "osu!taiko" },
        { value: "catch", label: "osu!catch" },
        { value: "mania", label: "osu!mania" },
    ];

    const typeOptions = [
        { value: "tournament", label: "Tournament" },
        { value: "contest", label: "Contest" },
    ];

    const suggestedTags = useMemo(() => {
        const tag = generateSuggestedTagFromName(form.values.name);
        if (!tag) return [];

        const existingTagsLower = new Set(form.values.tags.map((t) => t.toLowerCase()));
        if (existingTagsLower.has(tag.toLowerCase())) return [];

        return [tag];
    }, [form.values.name, form.values.tags]);

    const handleAddSuggestedTag = (tag: string) => {
        form.setFieldValue("tags", [...form.values.tags, tag.toUpperCase()]);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Tournament" size="lg">
            <LoadingOverlay
                visible={createTournamentMutation.isPending}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Tournament Name"
                        placeholder="Enter tournament name..."
                        {...form.getInputProps("name")}
                        withAsterisk
                    />

                    <MultipleUsersInput
                        value={selectedHosts}
                        onChange={handleHostsChange}
                        label="Hosts"
                        placeholder="Search for a host to add..."
                        required
                        error={form.errors.hostIds as string}
                        allowUserCreation
                        showActiveInfringementWarning
                    />

                    <MultiSelect
                        label="Game Modes"
                        placeholder="Select game modes"
                        data={modeOptions}
                        {...form.getInputProps("modes")}
                        withAsterisk
                    />

                    <Select
                        label="Type"
                        placeholder="Select type"
                        data={typeOptions}
                        {...form.getInputProps("type")}
                        withAsterisk
                    />

                    <TextInput
                        label="Forum/News URL"
                        placeholder="Enter forum/news URL..."
                        {...form.getInputProps("forumUrl")}
                    />

                    <TextInput
                        label="Banner URL"
                        placeholder="Enter banner image URL..."
                        {...form.getInputProps("bannerUrl")}
                    />

                    <TextInput
                        label="Enchant URL"
                        placeholder="Enter enchant ticket URL..."
                        {...form.getInputProps("enchantUrl")}
                    />

                    <Box>
                        <TagsInput
                            label="Search Tags"
                            placeholder="Enter tags..."
                            description="Press enter to add a tag, case-insensitive"
                            {...form.getInputProps("tags")}
                        />

                        {suggestedTags.length > 0 && (
                            <Box mt="xs">
                                <Text size="sm" fw={500} mb={4}>
                                    Suggested tags
                                </Text>
                                <Group gap="xs">
                                    {suggestedTags.map((tag) => (
                                        <Pill
                                            key={tag}
                                            onClick={() => handleAddSuggestedTag(tag)}
                                            style={{ cursor: "pointer" }}>
                                            <Group gap={6} wrap="nowrap">
                                                {tag}
                                                <FontAwesomeIcon icon="plus" size="xs" />
                                            </Group>
                                        </Pill>
                                    ))}
                                </Group>
                            </Box>
                        )}
                    </Box>

                    <Group grow>
                        <DateInput
                            label="Start Date"
                            placeholder="Select start date"
                            clearable
                            withAsterisk
                            {...form.getInputProps("startDate")}
                        />
                        <DateInput
                            label="End Date"
                            placeholder="Select end date"
                            clearable
                            withAsterisk
                            minDate={form.values.startDate || undefined}
                            {...form.getInputProps("endDate")}
                        />
                    </Group>

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={createTournamentMutation.isPending}
                            disabled={selectedHosts.some((host) => host.activeInfringement)}>
                            Create Tournament
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
