import { Stack, Group, Text, ActionIcon, Input, Anchor, FocusTrap } from "@mantine/core";
import { ITournament } from "../../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useUpdateThreadId } from "../../../hooks/useTournaments";
import { loggedInUserAtom } from "../../../store/atoms";
import { useAtom } from "jotai";
import config from "../../../../config.json";
import AlertText from "../../common/AlertText";
import CopyActionIcon from "../../common/buttons/CopyActionIcon";

interface IProps {
    tournament: ITournament;
}

export default function TournamentDiscordThread({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [threadId, setThreadId] = useState(tournament.threadId);
    const [isEditingThreadId, setIsEditingThreadId] = useState(false);
    const updateThreadIdMutation = useUpdateThreadId(tournament.id);

    const handleUpdateThreadId = async () => {
        await updateThreadIdMutation.mutateAsync(threadId ?? "");
        setIsEditingThreadId(false);
    };

    if (!user?.isCommitteeOrAdmin) return null;

    return (
        <Stack gap={5}>
            <Group gap="xs" align="center">
                <Text size="sm" fw={500} className="header-border-left">
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
                            <CopyActionIcon
                                value={`https://discord.com/channels/${config.discord.webhooks.main.serverId}/${tournament.threadId}`}
                                tooltip="Copy thread link"
                            />
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
                            target="_blank"
                            rel="noopener noreferrer">
                            {tournament.threadId}
                        </Anchor>
                    ) : (
                        <AlertText type="warning">
                            Not set! Make sure to set it to the thread where the tournament is being discussed.
                        </AlertText>
                    )}
                </Text>
            )}
        </Stack>
    );
}
