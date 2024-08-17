import mongoose, { Schema } from "mongoose";
import { ITournament, TournamentType, TournamentStatus } from "../../interfaces/Tournament";

const TournamentSchema = new Schema<ITournament>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: Object.values(TournamentType), required: true },
        bannerUrl: { type: String },
        badges: [{ type: String }],
        assignedReviewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        reviews: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
        status: { type: String, enum: Object.values(TournamentStatus), required: true },
        isActive: { type: Boolean, default: true },
    }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TournamentSchema.virtual("isTournament").get(function (this: ITournament) {
    return this.type === TournamentType.Tournament;
});

TournamentSchema.virtual("isContest").get(function (this: ITournament) {
    return this.type === TournamentType.Contest;
});

const Tournament = mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;