import { Table, Card, Tooltip } from "@mantine/core";
import { ILog } from "../../../interfaces/Log";
import moment from "moment";
import MarkdownText from "../common/MarkdownText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    logs: ILog[];
}

export default function LogsTable({ logs }: IProps) {
    return (
        <Card shadow="sm" p="lg" bg="primary.11">
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Action</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {logs.map((log) => (
                        <Table.Tr key={log._id}>
                            <Table.Td>
                                <Tooltip label={moment(log.createdAt).format("LLL")}>
                                    <span>{moment(log.createdAt).fromNow()}</span>
                                </Tooltip>
                            </Table.Td>
                            <Table.Td>
                                {log.user?.username || (
                                    <span>
                                        System <FontAwesomeIcon icon="robot" />
                                    </span>
                                )}
                            </Table.Td>
                            <Table.Td>{log.category}</Table.Td>
                            <Table.Td>
                                <MarkdownText content={log.action} />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Card>
    );
}
