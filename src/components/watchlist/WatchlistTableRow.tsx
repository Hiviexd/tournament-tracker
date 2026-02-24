import { Table, Group, Tooltip, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IUser } from "../../../interfaces/User";
import UserDisplay from "../common/UserDisplay";
import InfringementBadge from "../common/badges/InfringementBadge";
import InfringementExpirationBadge from "../common/badges/InfringementExpirationBadge";
import InfringementReasonHoverCard from "./InfringementReasonHoverCard";
import CopyActionIcon from "../common/buttons/CopyActionIcon";
import { getPrimaryInfringement } from "./watchlistUtils";

interface WatchlistTableRowProps {
    user: IUser;
    onUserSelect: (user: IUser) => void;
    getDiscordThreadLink: (threadId: string) => string;
}

export default function WatchlistTableRow({ user, onUserSelect, getDiscordThreadLink }: WatchlistTableRowProps) {
    const primary = getPrimaryInfringement(user);
    const latestAction = user.latestAction;
    const enchantUrl = primary?.enchantUrl ?? latestAction?.enchantUrl;
    const threadId = primary?.threadId ?? latestAction?.threadId;

    return (
        <Table.Tr>
            <Table.Td>
                <UserDisplay user={user} onClick={() => onUserSelect(user)} disablePopover />
            </Table.Td>
            <Table.Td>
                {primary ? (
                    <Group gap="xs" wrap="nowrap">
                        <InfringementReasonHoverCard infringement={primary}>
                            <InfringementBadge infringement={primary} />
                        </InfringementReasonHoverCard>
                        {primary.isTimeBased && (
                            <InfringementExpirationBadge infringement={primary} size="sm" />
                        )}
                    </Group>
                ) : (
                    "—"
                )}
            </Table.Td>
            <Table.Td>
                {latestAction ? (
                    <Group gap={4} wrap="nowrap">
                        <InfringementReasonHoverCard infringement={latestAction}>
                            <InfringementBadge infringement={latestAction} />
                        </InfringementReasonHoverCard>
                    </Group>
                ) : (
                    "—"
                )}
            </Table.Td>
            <Table.Td ta="center">
                {enchantUrl ? (
                    <Tooltip label="Open Enchant ticket">
                        <ActionIcon
                            variant="subtle"
                            onClick={() => window.open(enchantUrl, "_blank")}
                            color="primary"
                            size="md">
                            <FontAwesomeIcon icon="envelope" size="sm" />
                        </ActionIcon>
                    </Tooltip>
                ) : (
                    "—"
                )}
            </Table.Td>
            <Table.Td ta="center">
                {threadId ? (
                    <CopyActionIcon
                        value={getDiscordThreadLink(threadId)}
                        tooltip="Copy Discord thread link"
                        size="md"
                        color="primary"
                    />
                ) : (
                    "—"
                )}
            </Table.Td>
        </Table.Tr>
    );
}
