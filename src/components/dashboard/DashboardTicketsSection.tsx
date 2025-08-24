import { Stack, Title, Group, SimpleGrid, Badge } from "@mantine/core";
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
                <Title order={3} className="header-border-left">
                    Tickets
                </Title>
                <Badge color="gray" variant="light">
                    {tickets.length}
                </Badge>
            </Group>
            {tickets.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {tickets.map((ticket) => (
                        <TicketCard key={ticket._id} ticket={ticket} />
                    ))}
                </SimpleGrid>
            ) : (
                <EmptyState
                    style={{ marginBottom: "var(--mantine-spacing-md)" }}
                    height={100}
                    icon="paper-plane"
                    title="All tickets are clear!"
                    description="perennial_3rd_place.png"
                />
            )}
        </Stack>
    );
}
