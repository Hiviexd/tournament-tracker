import { ITicket } from "../../interfaces/Ticket";
import { IUser } from "../../interfaces/User";

class TicketService {
    /**
     * * Sanitizes ticket data based on user permissions
     * * Removes notes from non-committee users
     * * Depopulates committee message authors for privacy
     */
    public sanitizeTicket(ticket: ITicket, user: IUser | undefined): ITicket {
        if (!user || !user.isCommitteeOrAdmin) {
            // Filter out notes
            ticket.messages = ticket.messages.filter((message) => !message.isNote);

            // Depopulate committee member info from messages
            ticket.messages.forEach((message) => {
                if (message.isCommittee) {
                    message.depopulate("author");
                }
            });
        }

        return ticket;
    }
}

export default new TicketService();
