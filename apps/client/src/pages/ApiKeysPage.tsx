import { Title, Accordion, Card, Group, Stack, Text, Badge, Alert, Skeleton, Divider, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAllApiKeys, useRevokeApiKeyAdmin } from "../hooks/useApiKeys";
import UserDisplay from "../components/common/UserDisplay";
import DateBadge from "../components/common/badges/DateBadge";
import CopyActionIcon from "../components/common/buttons/CopyActionIcon";
import { useConfirmModal } from "../hooks/useModals";
import utils from "@tc/utils/client";

const PAGE_TITLE = "View all API keys across all users";

function getKeyStatus(apiKey: { revokedAt?: string | null; lastUsedAt?: string | null }) {
    if (apiKey.revokedAt) return { color: "red" as const, text: "Revoked" };
    if (!apiKey.lastUsedAt) return { color: "gray" as const, text: "Never Used" };
    return { color: "green" as const, text: "Active" };
}

function ApiKeysPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Title order={4} className="header-border-left">
                    {PAGE_TITLE}
                </Title>
                <Divider />
                {children}
            </Stack>
        </Card>
    );
}

function DateRow({ label, date, color = "dimmed" }: { label: string; date: Date; color?: "dimmed" | "red" }) {
    return (
        <Group gap="xs">
            <Text size="xs" c={color}>
                {label}
            </Text>
            <DateBadge date={date} size="sm" staticColor />
        </Group>
    );
}

export default function ApiKeysPage() {
    const { data: apiKeysData, isLoading, error } = useAllApiKeys();
    const revokeAdminMutation = useRevokeApiKeyAdmin();
    const confirmModal = useConfirmModal();

    if (isLoading) {
        return (
            <ApiKeysPageLayout>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={80} radius="md" />
                ))}
            </ApiKeysPageLayout>
        );
    }

    if (error) {
        return (
            <ApiKeysPageLayout>
                <Alert
                    variant="light"
                    color="danger"
                    title="Error"
                    icon={<FontAwesomeIcon icon="exclamation-triangle" />}>
                    Failed to load API keys. Please try again later.
                </Alert>
            </ApiKeysPageLayout>
        );
    }

    if (!apiKeysData || apiKeysData.length === 0) {
        return (
            <ApiKeysPageLayout>
                <Alert variant="light" color="blue" title="Info" icon={<FontAwesomeIcon icon="info-circle" />}>
                    No API keys found in the system.
                </Alert>
            </ApiKeysPageLayout>
        );
    }

    const handleRevokeKey = async (apiKey: { _id: unknown; name: string }) => {
        if (
            !(await confirmModal({
                preset: "delete",
                title: "Revoke API key?",
                text: `Revoke "${apiKey.name}"? The key will be invalid immediately.`,
                confirmText: "Revoke",
            }))
        )
            return;
        await revokeAdminMutation.mutateAsync(String(apiKey._id));
    };

    return (
        <ApiKeysPageLayout>
            <Accordion variant="separated" radius="md">
                {apiKeysData.map(({ user, apiKeys }) => (
                    <Accordion.Item key={user._id} value={user._id}>
                        <Accordion.Control>
                            <Group justify="space-between" align="center">
                                <UserDisplay user={user} />
                                <Badge variant="light" size="sm" leftSection={<FontAwesomeIcon icon="key" />} mr="xs">
                                    {utils.formatCount(apiKeys.length, "key")}
                                </Badge>
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="sm">
                                {apiKeys.map((apiKey) => {
                                    const status = getKeyStatus(apiKey);
                                    return (
                                        <Card key={apiKey._id} bg="primary.11" radius="md" padding="md">
                                            <Group justify="space-between" align="flex-start">
                                                <Stack gap="xs" style={{ flex: 1 }}>
                                                    <Group gap="sm" align="center">
                                                        <Text fw={600} size="sm" className="header-border-left">
                                                            {apiKey.name}
                                                        </Text>
                                                        <CopyActionIcon
                                                            value={String(apiKey._id)}
                                                            size="sm"
                                                            tooltip="Copy key ID"
                                                        />
                                                        <Badge variant="light" color={status.color} size="xs">
                                                            {status.text}
                                                        </Badge>
                                                        {apiKey.isElevated && (
                                                            <Badge variant="light" color="orange" size="xs">
                                                                <FontAwesomeIcon
                                                                    icon="crown"
                                                                    style={{ marginRight: 4 }}
                                                                />
                                                                Elevated
                                                            </Badge>
                                                        )}
                                                    </Group>

                                                    <Group gap="lg" align="flex-start">
                                                        <Stack gap={2}>
                                                            <Text size="xs" c="dimmed" fw={500}>
                                                                Scopes
                                                            </Text>
                                                            <Group gap="xs">
                                                                {apiKey.scopes && apiKey.scopes.length > 0 ? (
                                                                    apiKey.scopes.map((scope: string) => (
                                                                        <Badge key={scope} variant="light" size="xs">
                                                                            {scope}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <Text size="xs" c="dimmed">
                                                                        No scopes
                                                                    </Text>
                                                                )}
                                                            </Group>
                                                        </Stack>

                                                        <Stack gap={2}>
                                                            <Text size="xs" c="dimmed" fw={500}>
                                                                Usage
                                                            </Text>
                                                            <Text size="xs">
                                                                {utils.formatCount(apiKey.timesUsed || 0, "time")}
                                                            </Text>
                                                        </Stack>

                                                        {apiKey.lastRouteUsed && (
                                                            <Stack gap={2}>
                                                                <Text size="xs" c="dimmed" fw={500}>
                                                                    Last Route
                                                                </Text>
                                                                <Text size="xs" ff="monospace">
                                                                    {apiKey.lastRouteUsed}
                                                                </Text>
                                                            </Stack>
                                                        )}
                                                    </Group>
                                                </Stack>

                                                <Stack gap="xs" align="flex-end">
                                                    <DateRow label="Created:" date={new Date(apiKey.createdAt)} />
                                                    {apiKey.lastUsedAt && (
                                                        <DateRow
                                                            label="Last used:"
                                                            date={new Date(apiKey.lastUsedAt)}
                                                        />
                                                    )}
                                                    {apiKey.revokedAt && (
                                                        <DateRow
                                                            label="Revoked:"
                                                            date={new Date(apiKey.revokedAt)}
                                                            color="red"
                                                        />
                                                    )}
                                                    {!apiKey.revokedAt && (
                                                        <Button
                                                            variant="light"
                                                            color="red"
                                                            size="xs"
                                                            leftSection={<FontAwesomeIcon icon="ban" />}
                                                            loading={
                                                                revokeAdminMutation.isPending &&
                                                                revokeAdminMutation.variables === String(apiKey._id)
                                                            }
                                                            onClick={() => handleRevokeKey(apiKey)}>
                                                            Revoke key
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        </ApiKeysPageLayout>
    );
}
