import { useMemo, useState } from "react";
import { Alert, Button, Code, CopyButton, Divider, Group, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { useApiKeyMeta, useCreateApiKey, useRevokeApiKey } from "../../../hooks/useApiKeys";

export default function ApiKeySection() {
    const { data: meta, isLoading, isFetching } = useApiKeyMeta();
    const createMutation = useCreateApiKey();
    const revokeMutation = useRevokeApiKey();

    const [name, setName] = useState("");
    const [revealedKey, setRevealedKey] = useState<string | null>(null);

    const hasActiveKey = useMemo(() => !!meta && !meta.revokedAt, [meta]);

    const onCreate = async () => {
        if (!name.trim()) return;
        const res = await createMutation.mutateAsync({ name: name.trim() });
        setRevealedKey(res.key);
    };

    const onRevoke = async () => {
        await revokeMutation.mutateAsync();
        setRevealedKey(null);
        setName("");
    };

    return (
        <Stack gap="sm">
            <Divider label="API Key" labelPosition="left" />
            {isLoading || isFetching ? (
                <Text c="dimmed" size="sm">
                    Loading API key info…
                </Text>
            ) : hasActiveKey ? (
                <Stack gap="xs">
                    {revealedKey && (
                        <Alert color="yellow" title="Copy your API key now">
                            <Text size="sm" mb="xs">
                                This is the only time you’ll see the plaintext API key. Store it securely.
                            </Text>
                            <Group justify="space-between" wrap="nowrap">
                                <Code style={{ overflowX: "auto" }}>{revealedKey}</Code>
                                <CopyButton value={revealedKey}>
                                    {({ copied, copy }) => (
                                        <Button
                                            onClick={copy}
                                            variant="light"
                                            color={copied ? "teal" : "blue"}
                                            size="xs">
                                            {copied ? "Copied" : "Copy"}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                        </Alert>
                    )}

                    <Text size="sm">
                        <Text span fw={600}>
                            Name:
                        </Text>{" "}
                        {meta?.name ?? "-"}
                    </Text>
                    <Text size="sm">
                        <Text span fw={600}>
                            Created:
                        </Text>{" "}
                        {meta?.createdAt ? new Date(meta.createdAt).toLocaleString() : "-"}
                    </Text>
                    <Text size="sm">
                        <Text span fw={600}>
                            Last used:
                        </Text>{" "}
                        {meta?.lastUsed ? new Date(meta.lastUsed).toLocaleString() : "never"}
                    </Text>
                    <Group mt="xs">
                        <Tooltip label="Revoking invalidates the key immediately. You can generate a new one afterwards.">
                            <Button color="red" loading={revokeMutation.isPending} onClick={onRevoke}>
                                Revoke key
                            </Button>
                        </Tooltip>
                    </Group>
                </Stack>
            ) : (
                <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                        You can create one API key to access read-only endpoints programmatically.
                    </Text>
                    <TextInput
                        label="Name"
                        placeholder="e.g., Personal Script"
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                        required
                    />
                    <Group mt="xs">
                        <Button
                            onClick={onCreate}
                            loading={createMutation.isPending}
                            disabled={!name.trim()}>
                            Generate API key
                        </Button>
                    </Group>
                </Stack>
            )}
        </Stack>
    );
}
