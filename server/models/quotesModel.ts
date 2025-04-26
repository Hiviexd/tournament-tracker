import mongoose, { Schema } from "mongoose";
import { IQuote } from "../../interfaces/Quote";

const QuoteSchema = new Schema<IQuote>(
    {
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        quote: { type: String },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Quote = mongoose.model<IQuote>("Quote", QuoteSchema);

export default Quote;
