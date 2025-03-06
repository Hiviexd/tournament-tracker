import { Card, Group, Skeleton, Stack } from "@mantine/core";
import { useParams, useLocation, Navigate } from "react-router-dom";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useTicket } from "../hooks/useTickets";
import TicketInfo from "../components/tickets/TicketInfo";
import TicketMessages from "../components/tickets/TicketMessages";
import TicketMessageForm from "../components/tickets/TicketMessageForm";
import EmptyState from "../components/common/EmptyState";

export default function TicketDetailsPage() {
    const { ticketId } = useParams();
    const location = useLocation();
    const [user] = useAtom(loggedInUserAtom);
    const { data: ticket, isLoading } = useTicket(ticketId!);

    const isReportRoute = location.pathname.includes("/reports/");

    // Handle route mismatch after data is loaded
    if (ticket && !ticket.error) {
        const isReport = ticket.type === "report";
        const correctPath = isReport ? `/reports/${ticketId}` : `/tickets/${ticketId}`;

        // Redirect if we're on the wrong route type
        if ((isReport && !isReportRoute) || (!isReport && isReportRoute)) {
            return <Navigate to={correctPath} replace />;
        }
    }

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
                icon={isReportRoute ? "flag" : "paper-plane"}
                title={`${isReportRoute ? "Report" : "Ticket"} not found`}
                description={`This ${
                    isReportRoute ? "report" : "ticket"
                } does not exist or you don't have permission to view it`}
            />
        );
    }

    // only show to author when ticket is active
    const showMessageForm = user && ((ticket.isActive && ticket.author.id === user?.id) || user?.isCommittee);

    return (
        <Stack gap="md">
            <TicketInfo ticket={ticket} />
            <TicketMessages ticket={ticket} />
            {showMessageForm && <TicketMessageForm ticket={ticket} />}
        </Stack>
    );
}
