import mongoose, { Schema } from "mongoose";
import { ITicket } from "@interfaces/Ticket";

const TicketSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["ticket", "report"], required: true },
        assignedGroup: { type: String, required: true },
        title: { type: String, required: true },
        messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        isActive: { type: Boolean, required: true, default: true },
        targetUser: { type: Schema.Types.ObjectId, ref: "User" },
        targetTournament: { type: Schema.Types.ObjectId, ref: "Tournament" },
        threadId: { type: String },
        snoozedUntil: { type: Date },

        // temporary until tournaments model is used
        targetTournamentName: { type: String },
        targetTournamentLink: { type: String },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TicketSchema.virtual("isReport").get(function (this: ITicket) {
    return this.type === "report";
});

TicketSchema.virtual("isTicket").get(function (this: ITicket) {
    return this.type === "ticket";
});

TicketSchema.virtual("lastResponseAt").get(function (this: ITicket) {
    if (!this.messages?.length) return this.createdAt;

    // Filter out notes and undefined messages
    const validMessages = this.messages.filter(
        (message) => message && !message.isNote && message.createdAt
    );

    if (!validMessages.length) return this.createdAt;

    // Sort messages by createdAt, handling potential undefined values
    const sortedMessages = validMessages.sort((a, b) => {
        const timeA = a.createdAt?.getTime() || 0;
        const timeB = b.createdAt?.getTime() || 0;
        return timeB - timeA;
    });

    return sortedMessages[0]?.createdAt || this.createdAt;
});

TicketSchema.virtual("isSnoozed").get(function (this: ITicket) {
    return this.snoozedUntil && this.snoozedUntil > new Date();
});

const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
