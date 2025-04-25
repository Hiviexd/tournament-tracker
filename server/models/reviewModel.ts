import mongoose, { Schema } from "mongoose";
import { IReview } from "../../interfaces/Review";

const ReviewSchema = new Schema<IReview>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        comment: { type: String },
        vote: { type: String, required: true },
        checklist: [{ item: String, checked: Boolean, _id: false }],
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Review = mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
