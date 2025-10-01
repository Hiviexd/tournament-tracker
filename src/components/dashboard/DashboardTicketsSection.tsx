import { Stack, Title, Group, SimpleGrid, Badge, Collapse, Button, Tooltip } from "@mantine/core";
import TicketCard from "../tickets/TicketCard";
import { ITicket } from "../../../interfaces/Ticket";
import EmptyState from "../common/EmptyState";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    tickets: ITicket[];
}

export default function DashboardTicketsSection({ tickets }: IProps) {
    const [opened, { toggle }] = useDisclosure(tickets.length > 0);
    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Title order={3} className="header-border-left">
                    Tickets
                </Title>
                <Tooltip label="Open Tickets">
                    <Badge color={tickets.length > 0 ? "orange" : "gray"} variant="light">
                        {tickets.length}
                    </Badge>
                </Tooltip>
                <Button radius={1000} size="compact-sm" variant="light" onClick={toggle}>
                    <FontAwesomeIcon icon={opened ? "caret-up" : "caret-down"} />
                </Button>
            </Group>
            <Collapse in={opened}>
                {tickets.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {tickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
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
            </Collapse>
        </Stack>
    );
}
