import mongoose, { Schema } from "mongoose";
import { IVote, VoteCategory } from "../../interfaces/Vote";

const VoteSchema = new Schema<IVote>(
    {
        category: { type: String, enum: Object.values(VoteCategory), required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        options: [{ type: String, default: ["Agree", "Neutral", "Disagree"] }],
        reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
        consensus: { type: String, required: true },
        target: { type: Schema.Types.ObjectId, refPath: "category" },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

VoteSchema.virtual("deadline").get(function (this: IVote) {
    return new Date(this.createdAt.getTime() + this.duration * 24 * 60 * 60 * 1000);
});

VoteSchema.virtual("isActive").get(function (this: IVote) {
    return this.deadline > new Date();
});

VoteSchema.virtual("isTournamentVote").get(function (this: IVote) {
    return this.category === VoteCategory.Tournament;
});

VoteSchema.virtual("isUserVote").get(function (this: IVote) {
    return this.category === VoteCategory.User;
});

VoteSchema.virtual("isDiscussionVote").get(function (this: IVote) {
    return this.category === VoteCategory.Discussion;
});

const Vote = mongoose.model<IVote>("Vote", VoteSchema);

export default Vote;
