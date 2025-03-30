import mongoose, { Schema } from "mongoose";
import { ITournament } from "../../interfaces/Tournament";
import _ from "lodash";

const TournamentSchema = new Schema<ITournament>(
    {
        name: { type: String, required: true },
        modes: [{ type: String, required: true }],
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        forumUrl: { type: String, required: true },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true },
        status: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        banner: { type: Schema.Types.ObjectId, ref: "Attachment" },
        badges: [{ type: Schema.Types.ObjectId, ref: "Attachment" }],
        assignedReviewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
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

TournamentSchema.virtual("bannerUrl").get(function (this: ITournament) {
    return this.banner?.url || "https://nats.are-la.me/29HdcgA.png";
});

const Tournament = mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;
