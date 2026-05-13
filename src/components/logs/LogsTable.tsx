import { Table, Card, Tooltip, Text, ScrollArea } from "@mantine/core";
import { ILog } from "../../../interfaces/Log";
import dayjs from "../../../utils/dayjs";
import MarkdownText from "../common/MarkdownText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserLink from "../common/UserLink";

interface IProps {
    logs: ILog[];
}

export default function LogsTable({ logs }: IProps) {
    return (
        <Card shadow="sm" p="lg">
            <ScrollArea>
                <Table miw={800}>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={160}>Date</Table.Th>
                            <Table.Th w={30} p={0}></Table.Th>
                            <Table.Th w={150}>User</Table.Th>
                            <Table.Th w={120}>Category</Table.Th>
                            <Table.Th>Action</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {logs.map((log) => (
                            <Table.Tr key={log.id}>
                                <Table.Td>
                                    <Tooltip label={dayjs(log.createdAt).format("LLL")}>
                                        <span>{dayjs(log.createdAt).fromNow()}</span>
                                    </Tooltip>
                                </Table.Td>
                                <Table.Td p={0}>{log.isSystemLog && <FontAwesomeIcon icon="robot" />}</Table.Td>
                                <Table.Td>
                                    {log.isSystemLog ? (
                                        <Text size="sm" truncate>
                                            System
                                        </Text>
                                    ) : (
                                        <UserLink user={log.user} size="sm" />
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" fw={700}>
                                        {log.categoryString}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <MarkdownText content={log.action} size="sm" />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
        </Card>
    );
}
