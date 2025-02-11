import mongoose, { Schema } from "mongoose";
import { ITicket } from "../interfaces/Ticket";

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

        // temporary until tournaments model is used
        targetTournamentName: { type: String },
        targetTournamentLink: { type: String },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TicketSchema.virtual("isReport").get(function (this: ITicket) {
    return this.type === "report";
});

const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
