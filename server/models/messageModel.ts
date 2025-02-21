import mongoose, { Schema } from "mongoose";
import { IMessage } from "../../interfaces/Message";

const AttachmentSchema = new Schema(
    {
        originalName: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
        type: { type: String, required: true },
    },
    { _id: false }
);

const MessageSchema = new Schema<IMessage>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        isCommittee: { type: Boolean, required: true, default: false },
        isNote: { type: Boolean, default: false },
        attachments: [AttachmentSchema],
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
