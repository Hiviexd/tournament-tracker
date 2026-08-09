import { useState } from "react";
import { Stack, Group, Button, Card, Text, ActionIcon, Skeleton, Divider, Title, Alert, Anchor } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTemplates } from "../hooks/useTemplates";
import { ITemplate } from "@tc/types/Template";
import TemplateCreateModal from "../components/templates/TemplateCreateModal";
import TemplateEditModal from "../components/templates/TemplateEditModal";
import { loggedInUserAtom } from "../store/atoms";
import { useAtom } from "jotai";

function TemplatesLoadingState() {
    return (
        <Stack gap="lg">
            {[1, 2, 3].map((i) => (
                <Card key={i} shadow="sm" p="lg">
                    <Stack gap="md">
                        <Skeleton height={24} width="30%" />
                        <Divider />
                        {[1, 2, 3].map((j) => (
                            <Group key={j} justify="space-between">
                                <Stack gap="xs" style={{ flex: 1 }}>
                                    <Skeleton height={20} width="40%" />
                                    <Skeleton height={16} width="80%" />
                                </Stack>
                                <Skeleton height={32} width={32} circle />
                            </Group>
                        ))}
                    </Stack>
                </Card>
            ))}
        </Stack>
    );
}

function TemplatesEmptyState() {
    return (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon="comment-dots" size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                No templates found
            </Text>
            <Text size="sm" c="dimmed">
                Create your first template to get started
            </Text>
        </Stack>
    );
}

export default function TemplatesPage() {
    const [user] = useAtom(loggedInUserAtom);
    const { data: templates = [], isLoading } = useTemplates(user?.isCommittee ?? false);
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);

    const handleEditTemplate = (template: ITemplate) => {
        setSelectedTemplate(template);
        openEdit();
    };

    const handleCloseEdit = () => {
        closeEdit();
        setSelectedTemplate(null);
    };

    // Group templates by category
    const groupedTemplates = templates.reduce(
        (acc, template) => {
            if (!acc[template.category]) {
                acc[template.category] = [];
            }
            acc[template.category].push(template);
            return acc;
        },
        {} as Record<string, ITemplate[]>,
    );

    // Sort categories and templates within each category
    const sortedCategories = Object.entries(groupedTemplates)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, categoryTemplates]) => ({
            category,
            templates: (categoryTemplates as ITemplate[]).sort((a, b) => a.name.localeCompare(b.name)),
        }));

    return (
        <Stack gap="lg">
            <Alert color="info" icon={<FontAwesomeIcon icon="circle-info" />} title="Info">
                <Text size="sm">
                    These templates are for ticket/report responses. For email templates, visit{" "}
                    <Anchor href="/docs/email-templates">this documentation page</Anchor>.
                </Text>
            </Alert>
            <Group justify="space-between" align="center">
                <Button
                    onClick={openCreate}
                    leftSection={<FontAwesomeIcon icon="plus" />}
                    variant="filled"
                    color="primary"
                    fullWidth>
                    New Template
                </Button>
            </Group>

            <Divider />

            {isLoading ? (
                <TemplatesLoadingState />
            ) : templates.length === 0 ? (
                <TemplatesEmptyState />
            ) : (
                <Stack gap="lg">
                    {sortedCategories.map(({ category, templates }) => (
                        <Card key={category} shadow="sm" p="lg">
                            <Stack gap="md">
                                <Group justify="space-between" align="center">
                                    <Title order={4} className="header-border-left">
                                        {category}
                                    </Title>
                                    <Text size="sm" c="dimmed">
                                        {templates.length} template{templates.length !== 1 ? "s" : ""}
                                    </Text>
                                </Group>
                                <Divider />
                                <Stack gap="md">
                                    {templates.map((template) => (
                                        <Group key={template.id} justify="space-between" align="flex-start">
                                            <Stack gap="xs" style={{ flex: 1 }}>
                                                <Text fw={500}>{template.name}</Text>
                                                <Text size="sm" c="dimmed" lineClamp={2}>
                                                    {template.content}
                                                </Text>
                                            </Stack>
                                            <ActionIcon
                                                variant="subtle"
                                                color="blue"
                                                onClick={() => handleEditTemplate(template)}>
                                                <FontAwesomeIcon icon="edit" />
                                            </ActionIcon>
                                        </Group>
                                    ))}
                                </Stack>
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            )}

            <TemplateCreateModal opened={createOpened} onClose={closeCreate} />
            <TemplateEditModal opened={editOpened} onClose={handleCloseEdit} template={selectedTemplate} />
        </Stack>
    );
}
