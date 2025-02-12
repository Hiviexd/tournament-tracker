import mongoose, { Schema } from "mongoose";
import { IMessage } from "@interfaces/Message";

const MessageSchema = new Schema<IMessage>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        isCommittee: { type: Boolean, required: true, default: false },
        isNote: { type: Boolean, default: false },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
