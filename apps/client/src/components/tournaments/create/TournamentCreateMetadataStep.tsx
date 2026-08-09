import { useMemo } from "react";
import { Stack, TagsInput, Pill, Text, Box, Group } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ExtraLinksEditor from "../info/ExtraLinksEditor";
import { TournamentCreateFormValues, generateSuggestedTagFromName } from "./tournamentCreateForm";

interface IProps {
    form: UseFormReturnType<TournamentCreateFormValues>;
}

export default function TournamentCreateMetadataStep({ form }: IProps) {
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
    );
}
