import mongoose, { Schema, Types } from "mongoose";
import { IInfringement, IInfringementStatics, InfringementType, TIME_BASED_TYPES } from "../../interfaces/Infringement";
import startCase from "lodash/startCase.js";

const InfringementSchema = new Schema<IInfringement, IInfringementStatics>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: {
            type: String,
            required: true,
            enum: Object.values(InfringementType),
        },
        startDate: { type: Date },
        endDate: { type: Date },
        reason: { type: String, required: true },
        threadId: { type: String },
        enchantUrl: { type: String },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

InfringementSchema.virtual("isTimeBased").get(function (this: IInfringement) {
    return TIME_BASED_TYPES.includes(this.type);
});

InfringementSchema.virtual("isIndefinite").get(function (this: IInfringement) {
    return this.startDate && !this.endDate;
});

InfringementSchema.virtual("isExpired").get(function (this: IInfringement) {
    return this.endDate && this.endDate < new Date();
});

InfringementSchema.virtual("typeString").get(function (this: IInfringement) {
    return startCase(this.type);
});

InfringementSchema.statics.findActiveForUser = async function (userId: string | Types.ObjectId): Promise<IInfringement | null> {
    const indefinite = await this.findOne({
        userId,
        type: { $in: TIME_BASED_TYPES },
        startDate: { $exists: true, $ne: null },
        endDate: { $exists: false },
    });

    if (indefinite) return indefinite;

    return this.findOne({
        userId,
        type: { $in: TIME_BASED_TYPES },
        endDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });
};

const Infringement = mongoose.model<IInfringement, IInfringementStatics>("Infringement", InfringementSchema);

export default Infringement;
