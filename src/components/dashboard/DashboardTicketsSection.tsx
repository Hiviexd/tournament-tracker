import { Stack, Title, Group, Text, SimpleGrid, Divider } from "@mantine/core";
import TicketCard from "../tickets/TicketCard";
import { ITicket } from "../../../interfaces/Ticket";

interface IProps {
    tickets: ITicket[];
}

export default function DashboardTicketsSection({ tickets }: IProps) {
    if (tickets.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            <Divider />
            <Group align="center" gap="xs">
                <Title order={3}>Tickets</Title>
                <Text c="dimmed">({tickets.length})</Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {tickets.map((ticket) => (
                    <TicketCard key={ticket._id} ticket={ticket} />
                ))}
            </SimpleGrid>
        </Stack>
    );
}
