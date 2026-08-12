import mongoose from "mongoose";

/**
 * Apply global mongoose settings used across the monorepo.
 * Call once before connecting.
 */
export function initMongoose(): void {
    // Return the "new" updated object by default when doing findByIdAndUpdate
    mongoose.plugin((schema) => {
        schema.pre("findOneAndUpdate", function (this: any) {
            if (!("new" in this.options)) {
                this.setOptions({ new: true });
            }
        });
    });

    // Make queries strict like in v5
    mongoose.set("strictQuery", true);
}

export default initMongoose;
