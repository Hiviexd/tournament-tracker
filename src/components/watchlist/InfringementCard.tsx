import { Stack, Card, Group, Text, Badge, ActionIcon, Tooltip, Divider, ThemeIcon } from "@mantine/core";
import { IInfringement, InfringementType } from "../../../interfaces/User";
import InfringementBadge from "../common/badges/InfringementBadge";
import InfringementDurationBadge from "../common/badges/InfringementDurationBadge";
import InfringementExpirationBadge from "../common/badges/InfringementExpirationBadge";
import MarkdownText from "../common/MarkdownText";
import CopyActionIcon from "../common/buttons/CopyActionIcon";
import DateBadge from "../common/badges/DateBadge";
import config from "../../../config.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

interface IProps {
    infringement: IInfringement;
    userToNavigateTo?: number;
    onEdit?: (infringement: IInfringement) => void;
}

export default function InfringementCard({ infringement, userToNavigateTo, onEdit }: IProps) {
    const getDiscordThreadLink = (threadId: string) => {
        return `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${threadId}`;
    };

    const handleOpenTicket = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(infringement.enchantUrl, "_blank");
    };

    const handleEdit = () => {
        onEdit?.(infringement);
    };

    const cardContent = (mobileAlign: "flex-start" | "flex-end") => {
        return (
            <>
                <Stack gap="xs">
                    <Group gap="xs">
                        <InfringementBadge infringement={infringement} size="sm" />
                        {infringement.isPunishment && (
                            <Badge variant="light" color={infringement.isExpired ? "gray" : "green"} size="sm">
                                {infringement.isExpired ? "Expired" : "Active"}
                            </Badge>
                        )}
                    </Group>
                    {infringement.reason && <MarkdownText content={infringement.reason} size="sm" />}
                </Stack>
                <Stack gap="xs" align={mobileAlign} style={{ flexShrink: 0 }}>
                    {infringement.startDate && infringement.endDate && (
                        <Group gap={6} align="center" wrap="nowrap">
                            <Text size="xs" c="dimmed">
                                Duration:
                            </Text>
                            <InfringementDurationBadge infringement={infringement} size="sm" />
                        </Group>
                    )}
                    {infringement.endDate && (
                        <Group gap={6} align="center" wrap="nowrap">
                            <Text size="xs" c="dimmed">
                                Expires:
                            </Text>
                            <InfringementExpirationBadge infringement={infringement} size="sm" />
                        </Group>
                    )}
                </Stack>
            </>
        );
    };

    return (
        <Card
            key={`${infringement.type}-${infringement.createdAt}`}
            className="infringement-card"
            component={userToNavigateTo ? Link : "div" as any}
            to={userToNavigateTo ? `/watchlist?user=${userToNavigateTo}` : undefined}
            bg="primary.10"
            shadow="sm"
            p="md"
            radius="md"
            data-clickable={userToNavigateTo ? "true" : "false"}>
            <Stack gap="sm">
                {/* Desktop version */}
                <Group visibleFrom="sm" justify="space-between" align="flex-start" wrap="nowrap">
                    {cardContent("flex-end")}
                </Group>

                {/* Mobile version */}
                <Stack hiddenFrom="sm" justify="space-between" align="flex-start">
                    {cardContent("flex-start")}
                </Stack>

                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        {infringement.createdAt && (
                            <Group gap={6}>
                                <Text size="xs" c="dimmed">
                                    Created:
                                </Text>
                                <DateBadge date={infringement.createdAt} size="xs" staticColor />
                            </Group>
                        )}
                        {infringement.updatedAt && infringement.updatedAt > infringement.createdAt! && (
                            <>
                                <Divider orientation="vertical" />
                                <Group gap={6}>
                                    <Text size="xs" c="dimmed">
                                        Updated:
                                    </Text>
                                    <DateBadge date={infringement.updatedAt} size="xs" staticColor />
                                </Group>
                            </>
                        )}
                    </Group>

                    {!userToNavigateTo && (<Group gap={4}>
                        {infringement.type !== InfringementType.NOTE && !infringement.enchantUrl && (
                            <Tooltip label="Missing Email Ticket">
                                <ThemeIcon className="animation-pulse" variant="light" color="danger" size="md">
                                    <FontAwesomeIcon icon="envelope" size="sm" />
                                </ThemeIcon>
                            </Tooltip>
                        )}
                        {infringement.enchantUrl && (
                            <Tooltip label="Open Enchant ticket">
                                <ActionIcon
                                    variant="subtle"
                                    onClick={handleOpenTicket}
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
                        {onEdit && (
                            <Tooltip label="Edit infringement">
                                <ActionIcon
                                    variant="subtle"
                                    color="info"
                                    onClick={handleEdit}
                                    aria-label="Edit infringement">
                                    <FontAwesomeIcon icon="edit" />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>)}
                </Group>
            </Stack>
        </Card>
    );
}
