import { useState } from "react";
import { Stack, TextInput, Button, Table, Group, Card, ScrollArea, Skeleton, Tooltip } from "@mantine/core";
import { useAllQuotes, useCreateQuote } from "../hooks/useQuotes";
import UserSearch from "../components/common/UserSearch";
import { IUser } from "../../interfaces/User";
import UserLink from "../components/common/UserLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";

export default function QuotesPage() {
    const [quote, setQuote] = useState("");
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

    const { data: quotes = [], isLoading } = useAllQuotes();
    const createQuoteMutation = useCreateQuote(selectedUser?.id, quote ?? undefined);

    const LoadingState = () => (
        <ScrollArea>
            <Table miw={{ base: 1200, md: 800 }}>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Author</Table.Th>
                        <Table.Th>Quote</Table.Th>
                        <Table.Th>Added By</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Table.Tr key={i}>
                            <Table.Td>
                                <Skeleton height={20} width={120} />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width={100} />
                            </Table.Td>
                            <Table.Td>
                                <Skeleton height={20} width={300} />
                            </Table.Td>

                            <Table.Td>
                                <Group>
                                    <Skeleton height={20} width={100} />
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !quote) return;

        try {
            await createQuoteMutation.mutateAsync();
            setQuote("");
            setSelectedUser(null);
        } catch (error) {
            console.error("Failed to create quote:", error);
        }
    };

    return (
        <Stack p="md">
            <Card shadow="sm" p="md">
                <form onSubmit={handleSubmit}>
                    <Stack>
                        <UserSearch label="Author" onChange={setSelectedUser} required />

                        <TextInput
                            label="Quote"
                            placeholder="Enter a quote..."
                            value={quote}
                            onChange={(e) => setQuote(e.target.value)}
                            required
                        />

                        <Button
                            type="submit"
                            disabled={!selectedUser || !quote}
                            leftSection={<FontAwesomeIcon icon="plus" />}>
                            Create Quote
                        </Button>
                    </Stack>
                </form>
            </Card>

            <Card shadow="sm" p="md">
                {isLoading ? (
                    <LoadingState />
                ) : (
                    <ScrollArea>
                        <Table miw={{ base: 1200, md: 800 }}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Date</Table.Th>
                                    <Table.Th>Author</Table.Th>
                                    <Table.Th>Quote</Table.Th>
                                    <Table.Th>Added By</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {quotes.map((quote) => (
                                    <Table.Tr key={quote._id}>
                                        <Table.Td>
                                            <Tooltip label={moment(quote.createdAt).format("LLL")}>
                                                <span>{moment(quote.createdAt).fromNow()}</span>
                                            </Tooltip>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group>
                                                <UserLink user={quote.author} size="sm" />
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>{quote.quote}</Table.Td>

                                        <Table.Td>
                                            <Group>
                                                <UserLink user={quote.addedBy} size="sm" />
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Card>
        </Stack>
    );
}
