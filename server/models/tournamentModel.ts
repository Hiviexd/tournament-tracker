import mongoose, { Schema } from "mongoose";
import { ITournament } from "../../interfaces/Tournament";
import _ from "lodash";
import helpers from "../helpers";

const TournamentSchema = new Schema<ITournament>(
    {
        name: { type: String, required: true },
        modes: [{ type: String, required: true }],
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        forumUrl: {
            type: String,
            required: true,
            validate: {
                validator: (value: string) => helpers.isOsuForumLink(value.trim()),
                message:
                    "Forum URL must be a valid osu! forum topic link (e.g., https://osu.ppy.sh/community/forums/topics/123456)",
            },
        },
        threadId: { type: String },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, required: true },
        status: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        banner: { type: Schema.Types.ObjectId, ref: "Attachment" },
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
    return this.banner?.url || "/assets/default-banner.jpg";
});

const Tournament = mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;
