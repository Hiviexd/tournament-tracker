import { Request, Response } from "express";
import Article from "../models/articleModel";
import LogService from "../services/LogService";
import config from "../../config.json";

class ArticlesController {
    /** GET public article by slug */
    public async getPublicArticle(req: Request, res: Response) {
        const { slug } = req.params;

        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${slug}$`, "i") },
            isPublic: true,
        });

        if (!article) {
            return res.json({ error: "Article not found" });
        }

        res.json(article);
    }

    /** GET private article by slug (requires auth) */
    public async getPrivateArticle(req: Request, res: Response) {
        const { slug } = req.params;
        const user = res.locals!.user!;

        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${slug}$`, "i") },
        });

        if (!article) {
            return res.json({ error: "Article not found" });
        }

        // Check if user can access private article
        if (!article.isPublic && !user.isCommittee) {
            return res.json({ error: "You don't have permission to view this article" });
        }

        res.json(article);
    }

    /** GET documentation articles */
    public async getDocumentation(req: Request, res: Response) {
        const user = res.locals!.user;

        // Only committee members can access documentation
        if (!user?.isCommittee) {
            return res.json({ error: "You don't have permission to view this" });
        }

        //sort by title alphabetically
        const articles = await Article.find({ type: "documentation" }).sort({ title: 1 });
        res.json(articles);
    }

    /** POST create article */
    public async createArticle(req: Request, res: Response) {
        const { title, content, type, isPublic } = req.body;

        const article = new Article({
            title,
            content,
            type,
            isPublic,
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
            "article"
        );
    }

    /** POST edit article */
    public async editArticle(req: Request, res: Response) {
        const { slug } = req.params;
        const { content } = req.body;

        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${slug}$`, "i") },
        }).orFail();

        article.content = content;

        await article.save();

        res.json({
            message: "Article updated successfully",
            article,
        });

        // Logger
        await LogService.generate(
            req.session.mongoId!,
            `Updated the ${article.type} article: [**${article.title}**](${config.baseUrl}/articles/${article.slug})`,
            "article"
        );
    }
}

export default new ArticlesController();
