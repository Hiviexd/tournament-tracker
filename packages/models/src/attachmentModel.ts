import mongoose, { Schema } from "mongoose";
import { IAttachment } from "@tc/types/Attachment";

const AttachmentSchema = new Schema<IAttachment>(
    {
        originalName: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
        type: { type: String, required: true },
        category: { type: String, required: true }, // 'tickets', 'votings', etc.
        categoryObjectId: { type: Schema.Types.ObjectId, required: true }, // Reference to parent object
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true },
);

// Index for querying attachments by category and parent
AttachmentSchema.index({ category: 1, categoryObjectId: 1 });

const Attachment = mongoose.model<IAttachment>("Attachment", AttachmentSchema);
export default Attachment;
