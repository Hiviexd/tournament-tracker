import mongoose, { Schema } from "mongoose";
import { IVote, VoteType, VariableVoteScore, RankedChoiceVoteScore } from "@tc/types/Vote";
import { isNumber } from "@tc/utils/common";

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
                            return isNumber(data.option);
                        case "binary":
                            return isNumber(data.score) && data.score >= -5 && data.score <= 5;
                        case "variable":
                            return (
                                Array.isArray(data.scores) &&
                                data.scores.every(
                                    (s: VariableVoteScore) =>
                                        isNumber(s.optionIndex) && isNumber(s.score) && s.score >= -5 && s.score <= 5,
                                )
                            );
                        case "ranked-choice":
                            return (
                                Array.isArray(data.scores) &&
                                data.scores.every(
                                    (s: RankedChoiceVoteScore) =>
                                        isNumber(s.optionIndex) && isNumber(s.score) && s.score >= -2 && s.score <= 2,
                                )
                            );
                        case "binary-strict":
                            return isNumber(data.score) && data.score >= -1 && data.score <= 1;
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
