import mongoose, { Schema } from "mongoose";
import { ILog, LogCategory } from "../../interfaces/Log";

const LogSchema = new Schema<ILog>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, required: true },
        category: { type: String, enum: Object.values(LogCategory), required: true },
    }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Log = mongoose.model<ILog>("Log", LogSchema);

export default Log;
