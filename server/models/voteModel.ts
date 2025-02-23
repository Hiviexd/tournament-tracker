import mongoose, { Schema } from "mongoose";
import { IVote, VoteType, VariableVoteScore } from "../../interfaces/Vote";

const VoteDataSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["variable", "binary", "classic"],
        },
        // For classic votes
        option: { type: Number },
        // For binary votes
        score: { type: Number, min: -5, max: 5 },
        // For variable votes
        scores: [
            {
                _id: false,
                optionIndex: { type: Number },
                score: { type: Number, min: -5, max: 5 },
            },
        ],
    },
    { _id: false }
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
                                        s.score <= 5
                                )
                            );
                        default:
                            return false;
                    }
                },
                message: "Invalid vote data for the specified type",
            },
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Vote = mongoose.model<IVote>("Vote", VoteSchema);
export default Vote;
