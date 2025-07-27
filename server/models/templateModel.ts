import mongoose, { Schema } from "mongoose";
import { ITemplate } from "../../interfaces/Template";

const TemplateSchema = new Schema<ITemplate>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "Name must be at least 3 characters long"],
            maxlength: [80, "Name cannot exceed 80 characters"],
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "Content must be at least 10 characters long"],
            maxlength: [2000, "Content cannot exceed 2000 characters"],
        },
        category: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "Category must be at least 3 characters long"],
            maxlength: [50, "Category cannot exceed 50 characters"],
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Template = mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;
