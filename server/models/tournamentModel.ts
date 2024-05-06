import mongoose, { Schema } from "mongoose";
import { ITournament, TournamentType, TournamentStatus } from "../../interfaces/Tournament";

const TournamentSchema = new Schema<ITournament>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        staff: [{ type: Schema.Types.ObjectId, ref: "User" }],
        type: { type: String, enum: Object.values(TournamentType), required: true },
        bannerUrl: { type: String },
        badges: [{ type: String }],
        language: { type: String, required: true },
        assignedReviewers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        reviews: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
        status: { type: String, enum: Object.values(TournamentStatus), required: true },
        notes: [{ type: Schema.Types.ObjectId, ref: "Note" }],
    }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TournamentSchema.virtual("isTournament").get(function (this: ITournament) {
    return this.type === TournamentType.Tournament;
});

TournamentSchema.virtual("isContest").get(function (this: ITournament) {
    return this.type === TournamentType.Contest;
});

TournamentSchema.virtual("isOngoing").get(function (this: ITournament) {
    return this.startDate <= new Date() && this.endDate >= new Date();
});

TournamentSchema.virtual("isUpcoming").get(function (this: ITournament) {
    return this.startDate > new Date();
});

TournamentSchema.virtual("isConcluded").get(function (this: ITournament) {
    return this.endDate < new Date();
});

const Tournament = mongoose.model<ITournament>("Tournament", TournamentSchema);

export default Tournament;