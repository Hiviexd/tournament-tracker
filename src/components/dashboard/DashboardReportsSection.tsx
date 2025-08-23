import { Stack, Title, Group, Text, SimpleGrid, Divider } from "@mantine/core";
import TicketCard from "../tickets/TicketCard";
import { ITicket } from "../../../interfaces/Ticket";

interface IProps {
    reports: ITicket[];
}

export default function DashboardReportsSection({ reports }: IProps) {
    if (reports.length === 0) {
        return null;
    }

    return (
        <Stack gap="md">
            <Divider />
            <Group align="center" gap="xs">
                <Title order={3}>Reports</Title>
                <Text c="dimmed">({reports.length})</Text>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {reports.map((report) => (
                    <TicketCard key={report._id} ticket={report} />
                ))}
            </SimpleGrid>
        </Stack>
    );
}
