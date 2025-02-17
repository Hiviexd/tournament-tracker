import { Stack } from "@mantine/core";
import { useParams } from "react-router-dom";
import { useTicket } from "../hooks/useTickets";
import TicketInfo from "../components/tickets/TicketInfo";
import TicketMessages from "../components/tickets/TicketMessages";
import TicketMessageForm from "../components/tickets/TicketMessageForm";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";

export default function TicketDetailsPage() {
    const { ticketId } = useParams();
    const { data: ticket, isLoading } = useTicket(ticketId!);

    if (isLoading) {
        return <Loading />;
    }

    if (!ticket) {
        return (
            <EmptyState
                icon="ticket-alt"
                title="Ticket not found"
                description="This ticket does not exist or you don't have permission to view it"
            />
        );
    }

    return (
        <Stack gap="md">
            <TicketInfo ticket={ticket} />
            <TicketMessages ticket={ticket} messages={ticket.messages} />
            <TicketMessageForm ticketId={ticket._id} />
        </Stack>
    );
}
