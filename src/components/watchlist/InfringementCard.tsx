import { Stack, Card, Group, Text, Badge, ActionIcon, Tooltip } from "@mantine/core";
import { IInfringement } from "../../../interfaces/User";
import InfringementBadge from "../common/badges/InfringementBadge";
import InfringementDurationBadge from "../common/badges/InfringementDurationBadge";
import InfringementExpirationBadge from "../common/badges/InfringementExpirationBadge";
import MarkdownText from "../common/MarkdownText";
import CopyActionIcon from "../common/buttons/CopyActionIcon";
import DateBadge from "../common/badges/DateBadge";
import config from "../../../config.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    infringement: IInfringement;
    isActive: boolean;
}

export default function InfringementCard({ infringement, isActive }: IProps) {
    const getDiscordThreadLink = (threadId: string) => {
        return `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${threadId}`;
    };

    return (
        <Card key={`${infringement.type}-${infringement.createdAt}`} bg="primary.10" shadow="sm" p="md" radius="md">
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap="xs">
                        <Group gap="xs">
                            <InfringementBadge infringement={infringement} size="sm" />
                            {isActive && (
                                <Badge variant="light" color="green" size="sm">
                                    Active
                                </Badge>
                            )}
                        </Group>
                        {infringement.reason && <MarkdownText content={infringement.reason} size="sm" />}
                    </Stack>
                    <Stack gap="xs" align="flex-end" style={{ flexShrink: 0 }}>
                        <Group gap={6} align="center" wrap="nowrap">
                            <Text size="xs" c="dimmed">
                                Duration:
                            </Text>
                            <InfringementDurationBadge infringement={infringement} size="sm" />
                        </Group>
                        <Group gap={6} align="center" wrap="nowrap">
                            <Text size="xs" c="dimmed">
                                Expires:
                            </Text>
                            <InfringementExpirationBadge infringement={infringement} size="sm" />
                        </Group>
                    </Stack>
                </Group>

                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        {infringement.createdAt && (
                            <Group gap={5}>
                                <Text size="xs" c="dimmed">
                                    Created:
                                </Text>
                                <DateBadge date={infringement.createdAt} size="xs" staticColor />
                            </Group>
                        )}
                    </Group>

                    <Group gap={4}>
                        {infringement.enchantUrl && (
                            <Tooltip label="Open Enchant ticket">
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => window.open(infringement.enchantUrl, "_blank")}
                                    color="primary"
                                    size="md">
                                    <FontAwesomeIcon icon="envelope" size="sm" />
                                </ActionIcon>
                            </Tooltip>
                        )}

                        {infringement.threadId && (
                            <CopyActionIcon
                                value={getDiscordThreadLink(infringement.threadId)}
                                tooltip="Copy Discord thread link"
                                size="md"
                                color="primary"
                            />
                        )}
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}
