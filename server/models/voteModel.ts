import mongoose, { Schema } from "mongoose";
import { IVote } from "../../interfaces/Vote";

const VoteSchema = new Schema<IVote>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String },
        option: { type: Number, required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Vote = mongoose.model<IVote>("Vote", VoteSchema);

export default Vote;
