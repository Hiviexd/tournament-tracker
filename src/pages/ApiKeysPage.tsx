import { Title, Accordion, Card, Group, Stack, Text, Badge, Alert, Skeleton, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAllApiKeys } from "../hooks/useApiKeys";
import UserDisplay from "../components/common/UserDisplay";
import DateBadge from "../components/common/badges/DateBadge";
import utils from "../../utils";

export default function ApiKeysPage() {
    const { data: apiKeysData, isLoading, error } = useAllApiKeys();

    if (isLoading) {
        return (
            <Card shadow="sm" p="lg">
                <Stack gap="md">
                    <Title order={4} className="header-border-left">
                        View all API keys across all users
                    </Title>
                    <Divider />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={80} radius="md" />
                    ))}
                </Stack>
            </Card>
        );
    }

    if (error) {
        return (
            <Card shadow="sm" p="lg">
                <Stack gap="md">
                    <Title order={4} className="header-border-left">
                        View all API keys across all users
                    </Title>
                    <Divider />
                    <Alert
                        variant="light"
                        color="danger"
                        title="Error"
                        icon={<FontAwesomeIcon icon="exclamation-triangle" />}>
                        Failed to load API keys. Please try again later.
                    </Alert>
                </Stack>
            </Card>
        );
    }

    if (!apiKeysData || apiKeysData.length === 0) {
        return (
            <Card shadow="sm" p="lg">
                <Stack gap="md">
                    <Title order={4} className="header-border-left">
                        View all API keys across all users
                    </Title>
                    <Divider />
                    <Alert variant="light" color="blue" title="Info" icon={<FontAwesomeIcon icon="info-circle" />}>
                        No API keys found in the system.
                    </Alert>
                </Stack>
            </Card>
        );
    }

    const getKeyStatusColor = (apiKey: any) => {
        if (apiKey.revokedAt) return "red";
        if (!apiKey.lastUsedAt) return "gray";
        return "green";
    };

    const getKeyStatusText = (apiKey: any) => {
        if (apiKey.revokedAt) return "Revoked";
        if (!apiKey.lastUsedAt) return "Never Used";
        return "Active";
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Title order={4} className="header-border-left">
                    View all API keys across all users
                </Title>

                <Divider />

                <Accordion variant="separated" radius="md">
                    {apiKeysData.map(({ user, apiKeys }) => (
                        <Accordion.Item key={user._id} value={user._id}>
                            <Accordion.Control>
                                <Group justify="space-between" align="center">
                                    <UserDisplay user={user} />
                                    <Badge
                                        variant="light"
                                        size="sm"
                                        leftSection={<FontAwesomeIcon icon="key" />}
                                        mr="xs">
                                        {utils.formatCount(apiKeys.length, "key")}
                                    </Badge>
                                </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="sm">
                                    {apiKeys.map((apiKey) => (
                                        <Card key={apiKey._id} bg="primary.11" radius="md" padding="md">
                                            <Group justify="space-between" align="flex-start">
                                                <Stack gap="xs" style={{ flex: 1 }}>
                                                    <Group gap="sm" align="center">
                                                        <Text fw={600} size="sm" className="header-border-left">
                                                            {apiKey.name}
                                                        </Text>
                                                        <Badge
                                                            variant="light"
                                                            color={getKeyStatusColor(apiKey)}
                                                            size="xs">
                                                            {getKeyStatusText(apiKey)}
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
                                                    <Group gap="xs">
                                                        <Text size="xs" c="dimmed">
                                                            Created:
                                                        </Text>
                                                        <DateBadge
                                                            date={new Date(apiKey.createdAt)}
                                                            size="sm"
                                                            staticColor
                                                        />
                                                    </Group>
                                                    {apiKey.lastUsedAt && (
                                                        <Group gap="xs">
                                                            <Text size="xs" c="dimmed">
                                                                Last used:
                                                            </Text>
                                                            <DateBadge
                                                                date={new Date(apiKey.lastUsedAt)}
                                                                size="sm"
                                                                staticColor
                                                            />
                                                        </Group>
                                                    )}
                                                    {apiKey.revokedAt && (
                                                        <Group gap="xs">
                                                            <Text size="xs" c="red">
                                                                Revoked:
                                                            </Text>
                                                            <DateBadge
                                                                date={new Date(apiKey.revokedAt)}
                                                                size="sm"
                                                                staticColor
                                                            />
                                                        </Group>
                                                    )}
                                                </Stack>
                                            </Group>
                                        </Card>
                                    ))}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </Stack>
        </Card>
    );
}
