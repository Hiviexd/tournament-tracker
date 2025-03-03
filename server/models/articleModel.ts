import { Schema, model } from "mongoose";
import { IArticle } from "../../interfaces/Article";
import slugify from "slugify";

const articleSchema = new Schema<IArticle>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, "Title must be at least 3 characters long"],
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, "Content must be at least 10 characters long"],
        },
        type: {
            type: String,
            required: true,
            enum: ["documentation", "resource"],
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        slug: {
            type: String,
            unique: true,
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Generate slug before saving
articleSchema.pre("save", async function (next) {
    if (this.isModified("title")) {
        // Generate base slug from title
        const baseSlug = slugify(this.title, { replacement: "_", strict: true });

        // Check if slug exists
        let slug = baseSlug;
        let counter = 1;

        while (await Article.exists({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}_${counter}`;
            counter++;
        }

        this.slug = slug;
    }
    next();
});

const Article = model<IArticle>("Article", articleSchema);

export default Article;
