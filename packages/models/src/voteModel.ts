import mongoose, { Schema } from "mongoose";
import { IVote, VoteType, VariableVoteScore, RankedChoiceVoteScore } from "@tc/types/Vote";

const VoteDataSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["variable", "binary", "classic", "ranked-choice", "binary-strict"],
        },
        // For classic votes
        option: { type: Number },
        // For binary/strict binary votes
        score: { type: Number, min: -5, max: 5 },
        // For variable/ranked choice votes
        scores: [
            {
                _id: false,
                optionIndex: { type: Number },
                score: { type: Number, min: -5, max: 5 },
            },
        ],
    },
    { _id: false },
);

const VoteSchema = new Schema<IVote>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String },
        data: {
            type: VoteDataSchema,
            required: true,
            validate: {
                validator(data: VoteType) {
                    switch (data.type) {
                        case "classic":
                            return typeof data.option === "number";
                        case "binary":
                            return typeof data.score === "number" && data.score >= -5 && data.score <= 5;
                        case "variable":
                            return (
                                Array.isArray(data.scores) &&
                                data.scores.every(
                                    (s: VariableVoteScore) =>
                                        typeof s.optionIndex === "number" &&
                                        typeof s.score === "number" &&
                                        s.score >= -5 &&
                                        s.score <= 5,
                                )
                            );
                        case "ranked-choice":
                            return (
                                Array.isArray(data.scores) &&
                                data.scores.every(
                                    (s: RankedChoiceVoteScore) =>
                                        typeof s.optionIndex === "number" &&
                                        typeof s.score === "number" &&
                                        s.score >= -2 &&
                                        s.score <= 2,
                                )
                            );
                        case "binary-strict":
                            return typeof data.score === "number" && data.score >= -1 && data.score <= 1;
                        default:
                            return false;
                    }
                },
                message: "Invalid vote data for the specified type",
            },
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

const Vote = mongoose.model<IVote>("Vote", VoteSchema);
export default Vote;
