import mongoose, { Schema } from "mongoose";
import { ILog } from "../../interfaces/Log";
import _ from "lodash";

const LogSchema = new Schema<ILog>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        action: { type: String, required: true },
        category: { type: String, required: true },
        isSystemLog: { type: Boolean, default: false },
    }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

LogSchema.virtual("categoryString").get(function (this: ILog) {
    if (this.category === "api_key") return "API Key";
    return _.startCase(this.category);
});

const Log = mongoose.model<ILog>("Log", LogSchema);

export default Log;
