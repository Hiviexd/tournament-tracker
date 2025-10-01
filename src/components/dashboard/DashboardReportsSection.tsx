import { Stack, Title, Group, SimpleGrid, Badge, Collapse, Button, Tooltip } from "@mantine/core";
import TicketCard from "../tickets/TicketCard";
import { ITicket } from "../../../interfaces/Ticket";
import EmptyState from "../common/EmptyState";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    reports: ITicket[];
}

export default function DashboardReportsSection({ reports }: IProps) {
    const [opened, { toggle }] = useDisclosure(reports.length > 0);
    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Title order={3} className="header-border-left">
                    Reports
                </Title>
                <Tooltip label="Open Reports">
                    <Badge color={reports.length > 0 ? "red" : "gray"} variant="light">
                        {reports.length}
                    </Badge>
                </Tooltip>
                <Button radius={1000} size="compact-sm" variant="light" onClick={toggle}>
                    <FontAwesomeIcon icon={opened ? "caret-up" : "caret-down"} />
                </Button>
            </Group>
            <Collapse in={opened}>
                {reports.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {reports.map((report) => (
                            <TicketCard key={report.id} ticket={report} />
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
            </Collapse>
        </Stack>
    );
}
