import mongoose, { Schema } from "mongoose";
import { IVoting, VotingCategory } from "../../interfaces/Voting";

const VotingSchema = new Schema<IVoting>(
    {
        category: { type: String, enum: Object.values(VotingCategory), required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        duration: { type: Number, required: true },
        options: [{ type: String, default: ["Agree", "Neutral", "Disagree"] }],
        votes: [{ type: Schema.Types.ObjectId, ref: "Vote" }],
        target: { type: Schema.Types.ObjectId, refPath: "category" },
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
    return this.category === VotingCategory.Tournament;
});

VotingSchema.virtual("isUserVote").get(function (this: IVoting) {
    return this.category === VotingCategory.User;
});

VotingSchema.virtual("isDiscussionVote").get(function (this: IVoting) {
    return this.category === VotingCategory.Discussion;
});

const Voting = mongoose.model<IVoting>("Voting", VotingSchema);

export default Voting;
