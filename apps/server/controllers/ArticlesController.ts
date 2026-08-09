import { Request, Response } from "express";
import Article from "../models/articleModel";
import LogService from "../services/LogService";
import config from "@tc/config";
import utils from "@tc/utils/server";

class ArticlesController {
    /** GET article by slug */
    public async getArticle(req: Request, res: Response) {
        const { slug } = req.params;
        const user = res.locals!.user;

        const query: any = {
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        };

        if (!user?.isCommitteeOrAdmin) {
            query.isPublic = true;
        }

        const article = await Article.findOne(query).populate({
            path: "lastEditor",
            select: "username osuId groups coverUrl country",
        });

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        res.json(article);
    }

    /** GET documentation articles */
    public async getDocumentation(req: Request, res: Response) {
        const user = res.locals!.user;

        // Only committee members can access documentation
        if (!user?.isCommitteeOrAdmin) {
            return res.status(403).json({ error: "You don't have permission to view this" });
        }

        //sort by title alphabetically
        const articles = await Article.find({ type: "documentation" }).sort({ title: 1 });
        res.json(articles);
    }

    /** POST create article */
    public async createArticle(req: Request, res: Response) {
        const { title, content, type, isPublic } = req.body;

        if (!title || !content || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const article = new Article({
            title,
            content,
            type,
            isPublic,
            lastEditor: res.locals!.user!,
        });

        await article.save();

        res.json({
            message: "Article created successfully",
            article,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Created a new ${article.type} article: [**${article.title}**](${config.baseUrl}/articles/${article.slug})`,
            "article",
        );
    }

    /** POST edit article */
    public async editArticle(req: Request, res: Response) {
        const { slug } = req.params;
        const { title, content } = req.body;

        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        });

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        let oldTitle: string | null = null;
        let isEdited = false;

        if (title && title.trim() !== "" && title.trim() !== article.title.trim()) {
            oldTitle = article.title;
            article.title = title;
            isEdited = true;
        }

        if (content && content.trim() !== "" && content.trim() !== article.content.trim()) {
            article.content = content;
            isEdited = true;
        }

        if (isEdited) {
            article.lastEditor = res.locals!.user!;
        }

        await article.save();

        res.json({
            message: "Article updated successfully",
            article,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Updated the ${article.type} article: [**${oldTitle ? `${oldTitle} → ` : ""}${article.title}**](${
                config.baseUrl
            }/articles/${article.slug})`,
            "article",
        );
    }

    /** POST delete article */
    public async deleteArticle(req: Request, res: Response) {
        const { slug } = req.params;

        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        });
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        await article.deleteOne();

        res.json({
            message: "Article deleted successfully",
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Deleted the ${article.type} article: [**${article.title}**](${config.baseUrl}/articles/${article.slug})`,
            "article",
        );
    }
}

export default new ArticlesController();
