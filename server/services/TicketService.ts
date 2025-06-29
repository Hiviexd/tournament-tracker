import { ITicket } from "../../interfaces/Ticket";
import { IUser } from "../../interfaces/User";
import Ticket from "../models/ticketModel";

class TicketService {
    /**
     * * Sanitizes ticket data based on user permissions
     * * Removes notes from non-committee users
     * * Depopulates committee message authors for privacy
     */
    public sanitizeTicket(ticket: ITicket, user: IUser | undefined): ITicket {
        if (!user || !user.isCommittee) {
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

    /**
     * Gets all reports with targetTournamentLink containing the given forum ID
     * @param forumId The osu forum topic ID to match
     * @returns Array of tickets that are reports with matching forum IDs
     */
    public async getReportsByForumId(forumId: number): Promise<ITicket[]> {
        const reports = await Ticket.find({
            type: "report",
            targetTournamentLink: { $regex: `/topics/${forumId}` },
        }).populate([
            {
                path: "author",
                select: "username osuId groups",
            },
        ]);

        return reports;
    }
}

export default new TicketService();
