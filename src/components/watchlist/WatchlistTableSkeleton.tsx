import { Card, ScrollArea, Table, Skeleton, Group, Stack } from "@mantine/core";

export default function WatchlistTableSkeleton() {
    return (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table miw={{ base: 800, md: 700 }}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Primary</Table.Th>
                            <Table.Th>Latest action</Table.Th>
                            <Table.Th ta="center">Enchant</Table.Th>
                            <Table.Th ta="center">Thread</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Table.Tr key={i}>
                                <Table.Td>
                                    <Group gap="sm" wrap="nowrap" align="center">
                                        <Skeleton circle height={40} />
                                        <Stack gap={4} style={{ minWidth: 0 }}>
                                            <Skeleton height={16} width={Math.min(160, 120 + (i % 4) * 12)} />
                                        </Stack>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" wrap="nowrap">
                                        <Skeleton height={28} width={88 + (i % 3) * 8} radius="xl" />
                                        <Skeleton height={22} width={64} radius="xl" />
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4} wrap="nowrap">
                                        <Skeleton height={28} width={92 + (i % 2) * 10} radius="xl" />
                                    </Group>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group justify="center" wrap="nowrap">
                                        <Skeleton circle height={24} />
                                    </Group>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group justify="center" wrap="nowrap">
                                        <Skeleton circle height={24} />
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}
