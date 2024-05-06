import mongoose, { Schema } from "mongoose";
import { IComment } from '../../interfaces/Comment';

const CommentSchema = new Schema<IComment>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        vote: { type: Number },
    },     { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Comment = mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
