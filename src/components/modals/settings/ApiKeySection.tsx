import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Code,
    Group,
    MultiSelect,
    Stack,
    Text,
    TextInput,
    Skeleton,
    Anchor,
    Checkbox,
    Pill,
    ActionIcon,
    Table,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useApiKeyMeta, useCreateApiKey, useUpdateApiKey, useRevokeApiKey } from "../../../hooks/useApiKeys";
import { useConfirmModal } from "../../../hooks/useModals";
import { type ApiScope, AvailableApiScopes } from "../../../../interfaces/ApiKey";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CopyButton from "../../common/buttons/CopyButton";
import DateBadge from "../../common/badges/DateBadge";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../../store/atoms";
import AlertText from "../../common/AlertText";
import MarkdownText from "../../common/MarkdownText";

export default function ApiKeySection() {
    const [user] = useAtom(loggedInUserAtom);

    const DOCS_URL = "https://github.com/Hiviexd/tournament-tracker/wiki/API-Documentation";

    const { data: meta, isLoading } = useApiKeyMeta();
    const createKeyMutation = useCreateApiKey();
    const updateKeyMutation = useUpdateApiKey();
    const revokeKeyMutation = useRevokeApiKey();
    const confirmModal = useConfirmModal();

    const form = useForm({
        initialValues: {
            name: "",
            scopes: [] as ApiScope[],
            isElevated: false,
        },
        validate: {
            name: (value) => (!value || value.trim() === "" ? "Name is required" : null),
            scopes: (value) => (value.length === 0 ? "At least one scope is required" : null),
            isElevated: (value) => (value ? "API key elevation is disabled for now" : null),
        },
    });

    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [isEditingScopes, setIsEditingScopes] = useState(false);

    const hasActiveKey = useMemo(() => !!meta && !meta.revokedAt, [meta]);

    const handleCreateKey = async () => {
        const res = await createKeyMutation.mutateAsync({
            name: form.values.name.trim(),
            scopes: form.values.scopes,
            isElevated: form.values.isElevated,
        });
        setRevealedKey(res.key);
        form.reset();
    };

    const handleUpdateScopes = async () => {
        await updateKeyMutation.mutateAsync({ scopes: form.values.scopes });
        setIsEditingScopes(false);
        form.reset();
    };

    const handleEditScopes = () => {
        form.setValues({ scopes: meta?.scopes || [] });
        setIsEditingScopes(true);
    };

    const handleCancelEdit = () => {
        setIsEditingScopes(false);
        form.reset();
    };

    const handleRevokeKey = async () => {
        if (
            !(await confirmModal({
                preset: "delete",
                title: "Revoke API key?",
                text: "Are you sure you want to revoke this API key? Revoking invalidates the key immediately. You can generate a new one later.",
                confirmText: "Revoke",
            }))
        )
            return;
        await revokeKeyMutation.mutateAsync();
        setRevealedKey(null);
        form.reset();
    };

    return (
        <Stack gap="sm">
            {isLoading ? (
                <Skeleton height={150} />
            ) : hasActiveKey ? (
                <Stack gap="xs">
                    {revealedKey && (
                        <Alert color="yellow" title="Copy your API key now" icon={<FontAwesomeIcon icon="warning" />}>
                            <Text size="sm" mb="xs">
                                This is the only time you'll see the plain text API key. Store it securely.
                            </Text>
                            <Group justify="space-between" wrap="nowrap">
                                <Code style={{ overflowX: "auto" }}>{revealedKey}</Code>
                                <CopyButton
                                    size="xs"
                                    text="Copy API Key"
                                    leftSection={<FontAwesomeIcon icon="copy" />}
                                    value={revealedKey}
                                />
                            </Group>
                        </Alert>
                    )}

                    <Text size="sm" fw={600} mb="md">
                        Refer to{" "}
                        <Anchor href={DOCS_URL} target="_blank">
                            the documentation
                        </Anchor>{" "}
                        for more information.
                    </Text>

                    <Table>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Td style={{ fontWeight: 600, width: "30%" }}>Name</Table.Td>
                                <Table.Td>
                                    <Code>{meta?.name ?? "-"}</Code>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td style={{ fontWeight: 600 }}>Created</Table.Td>
                                <Table.Td>
                                    <DateBadge date={meta?.createdAt} size="sm" staticColor />
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td style={{ fontWeight: 600 }}>Scopes</Table.Td>
                                <Table.Td>
                                    {isEditingScopes ? (
                                        <Stack gap="xs">
                                            <MultiSelect
                                                placeholder="Select scopes"
                                                data={Object.values(AvailableApiScopes)}
                                                {...form.getInputProps("scopes")}
                                                size="sm"
                                            />
                                            <Group gap="xs">
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color="success"
                                                    leftSection={<FontAwesomeIcon icon="floppy-disk" />}
                                                    loading={updateKeyMutation.isPending}
                                                    disabled={form.values.scopes.length === 0}
                                                    onClick={handleUpdateScopes}>
                                                    Save
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="red"
                                                    leftSection={<FontAwesomeIcon icon="times" />}
                                                    onClick={handleCancelEdit}>
                                                    Cancel
                                                </Button>
                                            </Group>
                                        </Stack>
                                    ) : (
                                        <Group gap="xs">
                                            <Pill.Group>
                                                {meta?.scopes.map((scope) => (
                                                    <Pill key={scope}>{scope}</Pill>
                                                ))}
                                            </Pill.Group>
                                            <ActionIcon
                                                size="sm"
                                                variant="subtle"
                                                color="info"
                                                title="Edit scopes"
                                                onClick={handleEditScopes}>
                                                <FontAwesomeIcon icon="edit" size="xs" />
                                            </ActionIcon>
                                        </Group>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td style={{ fontWeight: 600 }}>Last used</Table.Td>
                                <Table.Td>
                                    {meta?.lastUsedAt ? (
                                        <DateBadge date={meta.lastUsedAt} size="sm" staticColor />
                                    ) : (
                                        <Text size="sm" c="dimmed">
                                            Never
                                        </Text>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td style={{ fontWeight: 600 }}>Times used</Table.Td>
                                <Table.Td>
                                    {meta?.timesUsed ? (
                                        <Code>{meta.timesUsed}</Code>
                                    ) : (
                                        <Text size="sm" c="dimmed">
                                            Never
                                        </Text>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td style={{ fontWeight: 600 }}>Last route used</Table.Td>
                                <Table.Td>
                                    {meta?.lastRouteUsed ? (
                                        <Code>{meta.lastRouteUsed}</Code>
                                    ) : (
                                        <Text size="sm" c="dimmed">
                                            Never
                                        </Text>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                    <Group mt="xs">
                        <Button
                            color="red"
                            variant="light"
                            leftSection={<FontAwesomeIcon icon="trash" />}
                            loading={revokeKeyMutation.isPending}
                            onClick={handleRevokeKey}>
                            Revoke Key
                        </Button>
                    </Group>
                </Stack>
            ) : (
                <form onSubmit={form.onSubmit(handleCreateKey)}>
                    <Stack gap="xs">
                        <Text size="sm">You can create one API key to access certain endpoints programmatically.</Text>
                        <Text size="sm" fw={600}>
                            Refer to{" "}
                            <Anchor fw={600} href={DOCS_URL} target="_blank">
                                the documentation
                            </Anchor>{" "}
                            for more information.
                        </Text>
                        <AlertText type="info" size="sm">
                            <MarkdownText
                                size="sm"
                                content="If you only care about using the Compliance API in your mappooling sheets, consult this [wiki page guide](https://github.com/Hiviexd/tournament-tracker/wiki/Compliance-API-Example-Usage)."
                            />
                        </AlertText>
                        <TextInput
                            label="Name"
                            placeholder="Enter project name"
                            {...form.getInputProps("name")}
                            withAsterisk
                        />
                        <MultiSelect
                            label="Scopes"
                            placeholder="Select scopes"
                            /* description={`If you only care about using the Mappool Compliance API, select "${AvailableApiScopes.BEATMAPS_READ}"`} */
                            data={Object.values(AvailableApiScopes)}
                            {...form.getInputProps("scopes")}
                            withAsterisk
                        />
                        {user?.isDev && (
                            <Checkbox
                                label="Elevate API key permissions"
                                description="This will grant the API key your website-level permissions."
                                disabled
                                {...form.getInputProps("isElevated")}
                            />
                        )}
                        <Group mt="xs">
                            <Button
                                type="submit"
                                variant="light"
                                leftSection={<FontAwesomeIcon icon="code" />}
                                loading={createKeyMutation.isPending}>
                                Generate API Key
                            </Button>
                        </Group>
                    </Stack>
                </form>
            )}
        </Stack>
    );
}
