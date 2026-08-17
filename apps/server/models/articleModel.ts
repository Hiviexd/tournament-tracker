import { Schema, model } from "mongoose";
import { IArticle } from "@tc/types/Article";
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
            enum: ["documentation", "resource", "news"],
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        slug: {
            type: String,
            unique: true,
        },
        lastEditor: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Generate slug before saving. News slugs stay stable after create so public links do not break.
articleSchema.pre("save", async function (next) {
    const shouldGenerateSlug = !this.slug || (this.isModified("title") && this.type !== "news");
    if (!shouldGenerateSlug) {
        return next();
    }

    const baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await Article.exists({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    this.slug = slug;
    next();
});

articleSchema.virtual("isDocumentation").get(function (this: IArticle) {
    return this.type === "documentation";
});

articleSchema.virtual("isNews").get(function (this: IArticle) {
    return this.type === "news";
});

const Article = model<IArticle>("Article", articleSchema);

export default Article;
