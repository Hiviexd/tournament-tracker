import { useMemo, useState } from "react";
import { useCreateTournament } from "../../hooks/useTournaments";
import {
    Modal,
    TextInput,
    Stack,
    Select,
    Button,
    Group,
    LoadingOverlay,
    TagsInput,
    Pill,
    Text,
    Box,
    Stepper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "../../../utils/dayjs";
import { notifications } from "@mantine/notifications";
import { GameMode, TournamentType, TournamentStatus, ITournamentExtraLink, TournamentFormData } from "../../../interfaces/Tournament";
import MultiSelect from "../common/MultiSelect";
import MultipleUsersInput from "../common/MultipleUsersInput";
import FileUploadInput from "../common/FileUploadInput";
import { useFileUpload } from "../../hooks/useFileUpload";
import utils from "../../../utils";
import { useNavigate } from "react-router";
import { IUser } from "../../../interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ExtraLinksEditor from "./info/ExtraLinksEditor";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

const STEPS = ["Basics", "Links", "Metadata", "Awards"] as const;

const badgeUploadOptions = {
    maxFiles: 8,
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ["image/png"],
};

const initialFormValues = {
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
    threadId: "",
    tags: [] as string[],
    extraLinks: [] as ITournamentExtraLink[],
};

const STEP_FIELDS: (keyof typeof initialFormValues)[][] = [
    ["name", "hostIds", "modes", "type", "startDate", "endDate"],
    ["forumUrl", "bannerUrl", "enchantUrl", "threadId"],
    ["extraLinks", "tags"],
    [],
];

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
    const [selectedWinners, setSelectedWinners] = useState<IUser[]>([]);
    const [active, setActive] = useState(0);
    const [isUploadingBadges, setIsUploadingBadges] = useState(false);
    const { files, handleFileChange, clearFiles } = useFileUpload(badgeUploadOptions);
    const navigate = useNavigate();

    const form = useForm({
        initialValues: initialFormValues,
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
                if (value && !utils.isOsuForumLink(value)) return "Invalid osu! forum URL";
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
            extraLinks: (value) => utils.validateExtraLinks(value),
        },
    });

    const resetFormState = () => {
        form.reset();
        setSelectedHosts([]);
        setSelectedWinners([]);
        clearFiles();
        setActive(0);
    };

    const handleClose = () => {
        resetFormState();
        onClose();
    };

    const handleHostsChange = (hosts: IUser[]) => {
        setSelectedHosts(hosts);
        form.setFieldValue(
            "hostIds",
            hosts.map((h) => h.id)
        );
    };

    const validateStep = (step: number) => {
        const fields = STEP_FIELDS[step];
        let hasError = false;
        for (const field of fields) {
            const result = form.validateField(field);
            if (result.hasError) hasError = true;
        }
        return !hasError;
    };

    const nextStep = () => {
        if (!validateStep(active)) return;
        setActive((current) => Math.min(current + 1, STEPS.length - 1));
    };

    const prevStep = () => {
        setActive((current) => Math.max(current - 1, 0));
    };

    const handleSubmit = async (values: typeof initialFormValues) => {
        if (active !== STEPS.length - 1) return;
        if (!validateStep(active)) return;

        try {
            const res = await createTournamentMutation.mutateAsync({
                ...values,
                threadId: values.threadId || undefined,
                winners: selectedWinners,
            } as unknown as TournamentFormData);

            const tournamentId = res.tournament._id?.toString?.() ?? res.tournament.id;

            if (files.length > 0 && tournamentId) {
                setIsUploadingBadges(true);
                try {
                    const formData = new FormData();
                    files.forEach((file) => formData.append("files", file));
                    const uploadResponse = await utils.apiCall({
                        method: "post",
                        url: `/api/tournaments/${tournamentId}/uploadBadges`,
                        data: formData,
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    if (uploadResponse.error) {
                        notifications.show({
                            title: "Badge upload failed",
                            message:
                                "Tournament was created, but badges could not be uploaded. You can retry from the tournament page.",
                            color: "orange",
                        });
                    }
                } catch (error) {
                    console.error("Failed to upload badges:", error);
                    notifications.show({
                        title: "Badge upload failed",
                        message:
                            "Tournament was created, but badges could not be uploaded. You can retry from the tournament page.",
                        color: "orange",
                    });
                } finally {
                    setIsUploadingBadges(false);
                }
            }

            resetFormState();
            onClose();
            navigate(`/tournaments/${tournamentId}`);
        } catch (error) {
            console.error("Failed to create tournament:", error);
        }
    };

    const handleCreateClick = () => {
        if (active !== STEPS.length - 1) return;
        form.onSubmit(handleSubmit, () => {
            for (let i = 0; i < STEP_FIELDS.length; i++) {
                if (!validateStep(i)) {
                    setActive(i);
                    return;
                }
            }
        })();
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

    const isPending = createTournamentMutation.isPending || isUploadingBadges;
    const isLastStep = active === STEPS.length - 1;

    return (
        <Modal opened={opened} onClose={handleClose} title="Create New Tournament" size="xl">
            <LoadingOverlay visible={isPending} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <form onSubmit={(event) => event.preventDefault()}>
                <Stack gap="md">
                    <Stepper active={active} onStepClick={setActive} size="sm" allowNextStepsSelect={false}>
                        <Stepper.Step label="Basics" description="Core details">
                            <Stack gap="md" mt="md">
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

                                <DatePickerInput
                                    type="range"
                                    label="Start & End Dates"
                                    placeholder="Select start and end date range"
                                    clearable
                                    withAsterisk
                                    value={[form.values.startDate, form.values.endDate]}
                                    onChange={(value) => {
                                        const [start, end] = value ?? [null, null];
                                        form.setFieldValue("startDate", start ? dayjs(start).toDate() : null);
                                        form.setFieldValue("endDate", end ? dayjs(end).toDate() : null);
                                    }}
                                    error={form.errors.startDate || form.errors.endDate}
                                />
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Links" description="External URLs">
                            <Stack gap="md" mt="md">
                                <TextInput
                                    label="Forum Link"
                                    placeholder="Enter forum URL..."
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

                                <TextInput
                                    label="Discord Thread"
                                    placeholder="Thread ID or Discord URL..."
                                    description="Paste a thread ID or full Discord channel/thread link"
                                    {...form.getInputProps("threadId")}
                                />
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Metadata" description="Tags & links">
                            <Stack gap="md" mt="md">
                                <Box>
                                    <Text size="sm" fw={500} mb={4}>
                                        Extra Links
                                    </Text>
                                    <ExtraLinksEditor
                                        value={form.values.extraLinks}
                                        onChange={(links) => form.setFieldValue("extraLinks", links)}
                                    />
                                    {form.errors.extraLinks && (
                                        <Text size="xs" c="red" mt={4}>
                                            {form.errors.extraLinks}
                                        </Text>
                                    )}
                                </Box>

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
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Awards" description="Winners & badges">
                            <Stack gap="md" mt="md">
                                <MultipleUsersInput
                                    value={selectedWinners}
                                    onChange={setSelectedWinners}
                                    label="Winners"
                                    placeholder="Search for a winner to add..."
                                    allowUserCreation
                                    showActiveInfringementWarning
                                />

                                <FileUploadInput
                                    value={files}
                                    onChange={handleFileChange}
                                    label="Badges"
                                    description="Badge(s) must be .png and 172x80px"
                                    placeholder="Up to 8 badges"
                                    options={badgeUploadOptions}
                                    accept={[".png"]}
                                />
                            </Stack>
                        </Stepper.Step>
                    </Stepper>

                    <Group justify="space-between" mt="md">
                        <Button type="button" variant="subtle" onClick={handleClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Group gap="xs">
                            {active > 0 && (
                                <Button type="button" variant="default" onClick={prevStep} disabled={isPending}>
                                    Back
                                </Button>
                            )}
                            {isLastStep ? (
                                <Button
                                    key="create"
                                    type="button"
                                    onClick={handleCreateClick}
                                    loading={isPending}
                                    disabled={selectedHosts.some((host) => host.activeInfringement)}>
                                    Create Tournament
                                </Button>
                            ) : (
                                <Button key="next" type="button" onClick={nextStep} disabled={isPending}>
                                    Next
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
