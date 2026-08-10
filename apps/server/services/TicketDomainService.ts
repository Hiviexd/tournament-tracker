import { MESSAGE_MODEL } from "../modules/common/database.tokens";
import type { IMessage } from "@tc/types/Message";
import type { Model } from "mongoose";
/** DI domain helpers used by Nest *Service HTTP layers — not controllers. */
import { Inject, Injectable } from "@nestjs/common";
import { ITicket } from "@tc/types/Ticket";
import { IUser } from "@tc/types/User";
import utils from "@tc/utils/server";

@Injectable()
export class TicketDomainService {
    constructor(
        @Inject(MESSAGE_MODEL) private readonly messageModel: Model<IMessage>,
    ) {}

    /**
     * * Sanitizes ticket data based on user permissions
     * * Removes notes from non-committee users
     * * Depopulates committee message authors for privacy
     */
    public sanitizeTicket<T extends ITicket>(ticket: T, user: IUser | undefined): T {
        if (!user || !user.isCommitteeOrAdmin) {
            // Filter out notes
            ticket.messages = ticket.messages.filter((message) => !message.isNote);

            // Depopulate committee member info from messages
            ticket.messages.forEach((message: any) => {
                if (message.isCommittee) {
                    message.depopulate("author");
                }
            });
        }

        return ticket;
    }

    /**
     * Searches for messages by content
     * @param search The search string to process
     * @returns An array of message IDs
     */
    public async searchMessageContent(search: string): Promise<string[]> {
        const searchTerms = utils.splitSearchTerms(search);

        // TODO: Consider using Meilisearch or Atlas Search for this in the future
        const messages = await this.messageModel.find({
            $and: searchTerms.map((term) => ({
                $or: [{ content: { $regex: utils.escapeRegexPattern(term), $options: "i" } }],
            })),
        }).distinct("_id");

        return messages.map((id) => id.toString());
    }
}
