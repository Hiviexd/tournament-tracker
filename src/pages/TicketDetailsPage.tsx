import { Card, Group, Skeleton, Stack } from "@mantine/core";
import { useParams } from "react-router-dom";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useTicket } from "../hooks/useTickets";
import TicketInfo from "../components/tickets/TicketInfo";
import TicketMessages from "../components/tickets/TicketMessages";
import TicketMessageForm from "../components/tickets/TicketMessageForm";
import EmptyState from "../components/common/EmptyState";

export default function TicketDetailsPage() {
    const { ticketId } = useParams();
    const [user] = useAtom(loggedInUserAtom);
    const { data: ticket, isLoading } = useTicket(ticketId!);

    if (isLoading) {
        return (
            <Stack gap="md">
                {/* TicketInfo skeleton */}
                <Card
                    shadow="sm"
                    p="lg"
                    radius="md"
                    className="ticket-info"
                    style={{
                        "--card-status-color": "var(--mantine-color-primary-6)",
                    }}>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Stack gap="xs">
                                <Skeleton height={24} width="60%" />
                                <Skeleton height={16} width="40%" />
                            </Stack>
                            <Group>
                                <Skeleton height={28} width={100} radius="xl" />
                                <Skeleton height={28} width={80} radius="xl" />
                            </Group>
                        </Group>
                        <Group>
                            <Skeleton height={22} width={80} radius="xl" />
                            <Skeleton height={22} width={100} radius="xl" />
                            <Skeleton height={22} width={90} radius="xl" />
                        </Group>
                    </Stack>
                </Card>

                {/* TicketMessages skeleton */}
                <Card shadow="sm" p="lg">
                    <Stack gap="md">
                        {[1, 2, 3].map((i) => (
                            <Stack key={i} gap="xs">
                                <Group>
                                    <Skeleton height={16} width={120} />
                                    <Skeleton height={16} width={80} />
                                </Group>
                                <Skeleton height={16} width="90%" />
                                <Skeleton height={16} width="70%" />
                            </Stack>
                        ))}
                    </Stack>
                </Card>

                {/* TicketMessageForm skeleton */}
                <Card shadow="sm" p="lg">
                    <Stack gap="sm">
                        <Skeleton height={100} />
                        <Group justify="flex-end">
                            <Skeleton height={36} width={120} radius="md" />
                        </Group>
                    </Stack>
                </Card>
            </Stack>
        );
    }

    if (!ticket || ticket.error) {
        return (
            <EmptyState
                icon="paper-plane"
                title="Ticket not found"
                description="This ticket does not exist or you don't have permission to view it"
            />
        );
    }

    const showMessageForm = ticket.isActive || user?.isCommittee;

    return (
        <Stack gap="md">
            <TicketInfo ticket={ticket} />
            <TicketMessages ticket={ticket} />
            {showMessageForm && <TicketMessageForm ticket={ticket} />}
        </Stack>
    );
}
