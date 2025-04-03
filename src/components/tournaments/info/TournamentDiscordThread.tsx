import { Stack, Group, Text, ActionIcon, Input, Anchor, FocusTrap } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useUpdateThreadId } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import config from "../../../../config.json";
import { notifications } from "@mantine/notifications";

interface IProps {
    tournament: ITournament;
}

export default function TournamentDiscordThread({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [threadId, setThreadId] = useState(tournament.threadId);
    const [isEditingThreadId, setIsEditingThreadId] = useState(false);
    const updateThreadIdMutation = useUpdateThreadId(tournament._id);

    const handleUpdateThreadId = async () => {
        await updateThreadIdMutation.mutateAsync(threadId ?? "");
        setIsEditingThreadId(false);
    };

    const handleCopyThreadLink = () => {
        navigator.clipboard.writeText(
            `https://discord.com/channels/${config.discord.webhooks.main.serverId}/${tournament.threadId}`
        );
        notifications.show({
            title: "Thread Link Copied",
            message: "Thread link copied to clipboard!",
            color: "success",
        });
    };

    if (!user?.isCommittee && !user?.isAdmin) return null;

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500}>
                    Discord thread ID:
                </Text>
                {isEditingThreadId ? (
                    <ActionIcon
                        variant="subtle"
                        onClick={() => {
                            setIsEditingThreadId(false);
                            setThreadId(tournament.threadId);
                        }}
                        color="danger"
                        title="Cancel">
                        <FontAwesomeIcon icon="xmark" />
                    </ActionIcon>
                ) : (
                    <Group gap={4}>
                        {tournament.isActive && (
                            <ActionIcon
                                variant="subtle"
                                onClick={() => setIsEditingThreadId(true)}
                                color="info"
                                title="Edit webhook location">
                                <FontAwesomeIcon icon="pen-to-square" />
                            </ActionIcon>
                        )}
                        {tournament.threadId?.length && (
                            <ActionIcon
                                variant="subtle"
                                onClick={handleCopyThreadLink}
                                color="success"
                                title="Copy thread link">
                                <FontAwesomeIcon icon="copy" />
                            </ActionIcon>
                        )}
                    </Group>
                )}
            </Group>
            {isEditingThreadId ? (
                <Group align="center" w={{ base: "100%", xs: "50%" }}>
                    <FocusTrap active={isEditingThreadId}>
                        <Input
                            value={threadId}
                            onChange={(event) => setThreadId(event.currentTarget.value)}
                            placeholder="Enter thread ID..."
                            style={{ flex: 1 }}
                            onFocus={(event) => event.target.select()}
                        />
                    </FocusTrap>
                    <ActionIcon
                        variant="subtle"
                        onClick={handleUpdateThreadId}
                        color="success"
                        title="Save"
                        loading={updateThreadIdMutation.isPending}>
                        <FontAwesomeIcon icon="save" />
                    </ActionIcon>
                </Group>
            ) : (
                <Text size="sm">
                    {tournament.threadId ? (
                        <Anchor
                            href={`https://discord.com/channels/${config.discord.webhooks.main.serverId}/${tournament.threadId}`}
                            target="_blank">
                            {tournament.threadId}
                        </Anchor>
                    ) : (
                        <Text c="danger" fs="italic">
                            Not set! Make sure to set it to the thread where the tournament is being discussed.
                        </Text>
                    )}
                </Text>
            )}
        </Stack>
    );
}
