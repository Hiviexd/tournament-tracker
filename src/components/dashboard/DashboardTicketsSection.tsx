import { Stack, Title, Group, Text, SimpleGrid } from "@mantine/core";
import TicketCard from "../tickets/TicketCard";
import { ITicket } from "../../../interfaces/Ticket";
import EmptyState from "../common/EmptyState";

interface IProps {
    tickets: ITicket[];
}

export default function DashboardTicketsSection({ tickets }: IProps) {
    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Title order={3}>Tickets</Title>
                <Text c="dimmed">({tickets.length})</Text>
            </Group>
            {tickets.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {tickets.map((ticket) => (
                        <TicketCard key={ticket._id} ticket={ticket} />
                    ))}
                </SimpleGrid>
            ) : (
                <EmptyState
                    height={100}
                    icon="paper-plane"
                    title="All tickets are clear!"
                    description="perennial_3rd_place.png"
                />
            )}
        </Stack>
    );
}
