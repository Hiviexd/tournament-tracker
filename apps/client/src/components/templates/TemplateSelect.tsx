import { useState, useMemo } from "react";
import { Button, Combobox, ScrollArea, Text, useCombobox, FocusTrap, HoverCard, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTemplates } from "../../hooks/useTemplates";
import { ITemplate } from "@tc/types/Template";
import MarkdownText from "../common/MarkdownText";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";

interface TemplateSelectProps {
    onTemplateSelect: (template: ITemplate) => void;
    buttonProps?: any;
    placeholder?: string;
}

export function TemplateSelect({ onTemplateSelect, buttonProps, placeholder = "Templates" }: TemplateSelectProps) {
    const [user] = useAtom(loggedInUserAtom);
    const { data: templates = [], isLoading } = useTemplates(user?.isCommittee ?? false);
    const [search, setSearch] = useState("");

    const combobox = useCombobox({
        onDropdownClose: () => {
            combobox.resetSelectedOption();
            setSearch("");
        },
    });

    // Filter and group templates by category
    const filteredAndGroupedTemplates = useMemo(() => {
        const filtered = templates.filter(
            (template) =>
                template.name.toLowerCase().includes(search.toLowerCase()) ||
                template.content.toLowerCase().includes(search.toLowerCase()) ||
                template.category.toLowerCase().includes(search.toLowerCase()),
        );

        const grouped: Record<string, ITemplate[]> = {};
        for (const template of filtered) {
            if (!grouped[template.category]) {
                grouped[template.category] = [];
            }
            grouped[template.category].push(template);
        }

        // Sort categories and templates within each category
        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryTemplates]) => ({
                category,
                templates: categoryTemplates.sort((a, b) => a.name.localeCompare(b.name)),
            }));
    }, [templates, search]);

    const handleTemplateSelect = (template: ITemplate) => {
        onTemplateSelect(template);
        combobox.closeDropdown();
        setSearch("");
    };

    // Render options grouped by category
    const options = filteredAndGroupedTemplates.map(({ category, templates }) => (
        <Combobox.Group label={category} key={category}>
            {templates.map((template) => (
                <Combobox.Option key={template.id} value={template.id} onClick={() => handleTemplateSelect(template)}>
                    <HoverCard position="left" shadow="md" offset={11} withArrow>
                        <HoverCard.Target>
                            <Box>
                                <Text size="sm" fw={500}>
                                    {template.name}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>
                                    {template.content}
                                </Text>
                            </Box>
                        </HoverCard.Target>
                        <HoverCard.Dropdown
                            maw={350}
                            p={0}
                            style={{ backgroundColor: "var(--mantine-color-primary-10)" }}>
                            <Text size="sm" p="sm">
                                <MarkdownText content={template.content} />
                            </Text>
                        </HoverCard.Dropdown>
                    </HoverCard>
                </Combobox.Option>
            ))}
        </Combobox.Group>
    ));

    return (
        <Combobox
            store={combobox}
            onOptionSubmit={() => {}} // Handled in individual option clicks
            position="top"
            width={250}
            withArrow
            withinPortal>
            <Combobox.Target>
                <Button
                    variant="light"
                    leftSection={<FontAwesomeIcon icon="comment-dots" size="sm" />}
                    onClick={() => combobox.toggleDropdown()}
                    loading={isLoading}
                    {...buttonProps}>
                    {placeholder}
                </Button>
            </Combobox.Target>

            <Combobox.Dropdown>
                <FocusTrap active={combobox.dropdownOpened}>
                    <Combobox.Search
                        id="template-search"
                        placeholder="Search templates..."
                        leftSection={<FontAwesomeIcon icon="search" size="sm" />}
                        value={search}
                        onChange={(event) => setSearch(event.currentTarget.value)}
                        onFocus={() => combobox.openDropdown()}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                // Select the first option
                                handleTemplateSelect(filteredAndGroupedTemplates[0].templates[0]);
                            }
                        }}
                    />
                </FocusTrap>

                <Combobox.Options>
                    <ScrollArea h={300}>
                        {options.length > 0 ? (
                            options
                        ) : (
                            <Combobox.Empty>
                                {search ? "No templates found..." : "No templates available..."}
                            </Combobox.Empty>
                        )}
                    </ScrollArea>
                </Combobox.Options>
            </Combobox.Dropdown>
        </Combobox>
    );
}
