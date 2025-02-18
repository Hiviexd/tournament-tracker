import { Stack } from "@mantine/core";
import { useParams } from "react-router-dom";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { useTicket } from "../hooks/useTickets";
import TicketInfo from "../components/tickets/TicketInfo";
import TicketMessages from "../components/tickets/TicketMessages";
import TicketMessageForm from "../components/tickets/TicketMessageForm";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";

export default function TicketDetailsPage() {
    const { ticketId } = useParams();
    const [user] = useAtom(loggedInUserAtom);
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

    const showMessageForm = ticket.isActive || user?.isCommittee;

    return (
        <Stack gap="md">
            <TicketInfo ticket={ticket} />
            <TicketMessages ticket={ticket} />
            {showMessageForm && <TicketMessageForm ticket={ticket} />}
        </Stack>
    );
}
