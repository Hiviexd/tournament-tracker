import { Stack, Title, Group, Text, SimpleGrid } from "@mantine/core";
import TicketCard from "../tickets/TicketCard";
import { ITicket } from "../../../interfaces/Ticket";
import EmptyState from "../common/EmptyState";

interface IProps {
    reports: ITicket[];
}

export default function DashboardReportsSection({ reports }: IProps) {
    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Title order={3}>Reports</Title>
                <Text c="dimmed">({reports.length})</Text>
            </Group>
            {reports.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {reports.map((report) => (
                        <TicketCard key={report._id} ticket={report} />
                    ))}
                </SimpleGrid>
            ) : (
                <EmptyState
                    height={100}
                    icon="flag"
                    title="All reports are clear!"
                    description={`When in doubt, ping t1g with a "why" for no reason.`}
                />
            )}
        </Stack>
    );
}
