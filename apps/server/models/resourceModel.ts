import mongoose, { Schema } from "mongoose";
import { IResource } from "@tc/types/Resource";

const ResourceSchema = new Schema<IResource>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: "User" },
        category: { type: String, required: true, enum: ["discord", "tool", "guide", "spreadsheet", "article"] },
        type: { type: String, required: true, enum: ["official", "community"] },
        link: { type: String, required: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

const Resource = mongoose.model<IResource>("Resource", ResourceSchema);

export default Resource;
