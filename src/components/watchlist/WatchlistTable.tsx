import { Card, ScrollArea, Table } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import WatchlistTableRow from "./WatchlistTableRow";

interface WatchlistTableProps {
    users: IUser[];
    onUserSelect: (user: IUser) => void;
    getDiscordThreadLink: (threadId: string) => string;
}

export default function WatchlistTable({ users, onUserSelect, getDiscordThreadLink }: WatchlistTableProps) {
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
                        {users.map((user) => (
                            <WatchlistTableRow
                                key={user.id}
                                user={user}
                                onUserSelect={onUserSelect}
                                getDiscordThreadLink={getDiscordThreadLink}
                            />
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}
