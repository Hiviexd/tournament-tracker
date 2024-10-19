import mongoose, { Schema } from "mongoose";
import { IVoting } from "../../interfaces/Voting";

const VotingSchema = new Schema<IVoting>(
    {
        category: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        duration: { type: Number, required: true },
        options: [{ type: String, default: ["Agree", "Neutral", "Disagree"] }],
        votes: [{ type: Schema.Types.ObjectId, ref: "Vote" }],
        targetUser: { type: Schema.Types.ObjectId, ref: "User" },
        targetTournament: { type: Schema.Types.ObjectId, ref: "Tournament" },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

VotingSchema.virtual("deadline").get(function (this: IVoting) {
    return new Date(this.createdAt.getTime() + this.duration * 24 * 60 * 60 * 1000);
});

VotingSchema.virtual("isOverdue").get(function (this: IVoting) {
    return this.deadline > new Date();
});

VotingSchema.virtual("isTournamentVote").get(function (this: IVoting) {
    return this.category === "tournament";
});

VotingSchema.virtual("isUserVote").get(function (this: IVoting) {
    return this.category === "user";
});

VotingSchema.virtual("isDiscussionVote").get(function (this: IVoting) {
    return this.category === "discussion";
});

const Voting = mongoose.model<IVoting>("Voting", VotingSchema);

export default Voting;
