import mongoose, { Schema } from "mongoose";
import { ITournament } from "../../interfaces/Tournament";
import _ from "lodash";
import helpers from "../helpers";

const TournamentSchema = new Schema<ITournament>(
    {
        name: { type: String, required: true },
        modes: [{ type: String, required: true }],
        startDate: {
            type: Date,
            required: true,
            set: helpers.setDateToNoon,
            get: (date: Date) => date,
        },
        endDate: {
            type: Date,
            required: true,
            set: helpers.setDateToNoon,
            get: (date: Date) => date,
        },
        forumUrl: { type: String },
        bannerUrl: { type: String },
        threadId: { type: String },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true },
        status: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        badges: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
        assignedReviewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
        logs: [
            {
                user: { type: Schema.Types.ObjectId, ref: "User" },
                action: { type: String, required: true },
                icon: { type: String, default: "history" },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        notes: [{ type: Schema.Types.ObjectId, ref: "Message" }],
        winners: [{ type: Schema.Types.ObjectId, ref: "User" }],
        enchantUrl: { type: String },
        startedReviewAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true, getters: true },
    }
);

TournamentSchema.virtual("isTournament").get(function (this: ITournament) {
    return this.type === "tournament";
});

TournamentSchema.virtual("isContest").get(function (this: ITournament) {
    return this.type === "contest";
});

TournamentSchema.virtual("statusString").get(function (this: ITournament) {
    return _.startCase(this.status);
});

const Tournament = mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;
