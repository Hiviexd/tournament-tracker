import { Card, ScrollArea, Table, Skeleton } from "@mantine/core";

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
                                <Table.Td><Skeleton height={20} width={120} /></Table.Td>
                                <Table.Td><Skeleton height={20} width={100} /></Table.Td>
                                <Table.Td><Skeleton height={20} width={90} /></Table.Td>
                                <Table.Td ta="center"><Skeleton height={20} width={40} /></Table.Td>
                                <Table.Td ta="center"><Skeleton height={20} width={40} /></Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}
