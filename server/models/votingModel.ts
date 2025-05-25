import mongoose, { Schema } from "mongoose";
import { IVoting } from "../../interfaces/Voting";

const VotingSchema = new Schema<IVoting>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        category: {
            type: String,
            required: true,
            enum: ["tournament", "user", "discussion"],
        },
        assignedGroups: [{ type: String, required: true }],
        title: { type: String, required: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        duration: { type: Number, required: true },
        type: {
            type: String,
            required: true,
            enum: ["variable", "binary", "classic", "binary-strict", "ranked-choice"],
            default: "classic",
        },
        options: [{ type: String, required: true }],
        votes: [{ type: Schema.Types.ObjectId, ref: "Vote" }],
        targetUser: { type: Schema.Types.ObjectId, ref: "User" },
        targetTournamentName: { type: String },
        targetTournamentLink: { type: String },
        requiredVotes: { type: Number, default: 1 },
        attachments: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
        isPublic: { type: Boolean, default: false },
        publicDescription: { type: String },
        concludedAt: { type: Date },
        allowNeutralVotes: { type: Boolean, default: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

VotingSchema.pre("save", function (next) {
    switch (this.type) {
        case "binary":
            if (this.options.length !== 2) {
                next(new Error("Binary votes must have exactly 2 options"));
            }
            break;
        case "classic":
        case "variable":
            if (this.options.length < 2) {
                next(new Error("Votes must have at least 2 options"));
            }
            break;
    }
    next();
});

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

VotingSchema.virtual("isTournamentCommitteeVote").get(function (this: IVoting) {
    return this.assignedGroups.includes("tc");
});

VotingSchema.virtual("isContestCommitteeVote").get(function (this: IVoting) {
    return this.assignedGroups.includes("cc");
});

const Voting = mongoose.model<IVoting>("Voting", VotingSchema);

export default Voting;
