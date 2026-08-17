import { Request, Response } from "express";
import Article from "../models/articleModel";
import User from "../models/userModel";
import LogService from "../services/LogService";
import config from "@tc/config";
import utils from "@tc/utils/server";
import { isString } from "@tc/utils/common";
import { EmbedBuilder } from "../services/discord/EmbedBuilder";
import { WebhookBuilder } from "../services/discord/WebhookBuilder";
import DiscordUtils from "../services/discord/DiscordUtils";
import NotificationDispatchService from "../services/NotificationDispatchService";
import OsuBotService from "../services/OsuBotService";

const NEWS_PAGE_SIZE = 3;
const NEWS_PUBLIC_MAX_LIMIT = 20;
const NEWS_COMMITTEE_MAX_LIMIT = 200;
const DISCORD_EMBED_DESCRIPTION_LIMIT = 2000;

function getNewsUrl(slug: string): string {
    return `${config.baseUrl}/?news=${slug}`;
}

function buildNewsWebhook(article: { title: string; content: string; slug: string }): WebhookBuilder {
    return new WebhookBuilder()
        .addEmbed(
            new EmbedBuilder()
                .setColor(DiscordUtils.webhookColors.lightBlue)
                .setTitle(`📢 ${article.title}`)
                .setUrl(getNewsUrl(article.slug))
                .setDescription(utils.shorten(article.content, DISCORD_EMBED_DESCRIPTION_LIMIT)),
        )
        .setLocation("news");
}

async function enqueueNewsWebhook(builder: WebhookBuilder, articleId?: string): Promise<void> {
    await NotificationDispatchService.enqueueDiscordWebhook(
        builder.toPayload(),
        "discord.news",
        articleId ? { articleId } : undefined,
    );
}

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

    /** GET public news posts */
    public async getNews(req: Request, res: Response) {
        const user = res.locals!.user;
        const skip = Math.max(0, Number(req.query.skip) || 0);
        const requestedLimit = Number(req.query.limit);
        const maxLimit = user?.isCommitteeOrAdmin ? NEWS_COMMITTEE_MAX_LIMIT : NEWS_PUBLIC_MAX_LIMIT;
        const limit =
            Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, maxLimit) : NEWS_PAGE_SIZE;

        const [articles, total] = await Promise.all([
            Article.find({ type: "news" }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Article.countDocuments({ type: "news" }),
        ]);

        res.json({ articles, total });
    }

    /** GET a single news post by slug */
    public async getNewsPost(req: Request, res: Response) {
        const { slug } = req.params;

        const article = await Article.findOne({
            type: "news",
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        });

        if (!article) {
            return res.status(404).json({ error: "News post not found" });
        }

        res.json(article);
    }

    /** POST create a news post */
    public async createNewsPost(req: Request, res: Response) {
        const { title, content, pingNewsRole } = req.body;

        if (!isString(title) || title.trim().length === 0) {
            return res.status(400).json({ error: "Title is required" });
        }

        if (!isString(content) || content.trim().length === 0) {
            return res.status(400).json({ error: "Content is required" });
        }

        const article = new Article({
            title: title.trim(),
            content: content.trim(),
            type: "news",
            isPublic: true,
            lastEditor: res.locals!.user!,
        });

        await article.save();

        res.json({
            message: "News post created successfully",
            article,
        });

        const newsUrl = getNewsUrl(article.slug);

        try {
            await LogService.generate(
                req.session.mongoId!,
                `Created a new news article: [**${article.title}**](${newsUrl})`,
                "article",
            );

            const builder = buildNewsWebhook(article).waitForMessage();

            if (pingNewsRole === true) {
                builder.addRoles(["news"]);
            }

            await enqueueNewsWebhook(builder, String(article._id));
        } catch (error) {
            console.error("Failed to publish news post to Discord:", error);
        }

        try {
            const subscribers = await User.find({ isSubscribedToNews: true }).select("osuId");
            if (subscribers.length > 0) {
                await OsuBotService.sendAnnouncement(
                    subscribers.map((subscriber) => subscriber.osuId),
                    {
                        channel: {
                            name: "News From The Tournament Committee",
                            description: utils.shorten(article.title, 100),
                        },
                        content: `A new Tournament Committee news post has been published:\n\n[**${article.title}**](${newsUrl})`,
                    },
                    res.locals!.user!.osuId,
                );
            }
        } catch (error) {
            console.error("Failed to send news osu announcement:", error);
        }
    }

    /** PUT edit a news post */
    public async editNewsPost(req: Request, res: Response) {
        const { slug } = req.params;
        const { title, content } = req.body;

        const article = await Article.findOne({
            type: "news",
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        });

        if (!article) {
            return res.status(404).json({ error: "News post not found" });
        }

        let oldTitle: string | null = null;
        let isEdited = false;

        if (isString(title) && title.trim() !== "" && title.trim() !== article.title.trim()) {
            oldTitle = article.title;
            article.title = title.trim();
            isEdited = true;
        }

        if (isString(content) && content.trim() !== "" && content.trim() !== article.content.trim()) {
            article.content = content.trim();
            isEdited = true;
        }

        if (isEdited) {
            article.lastEditor = res.locals!.user!;
        }

        await article.save();

        res.json({
            message: "News post updated successfully",
            article,
        });

        try {
            await LogService.generate(
                req.session.mongoId!,
                `Updated the news article: [**${oldTitle ? `${oldTitle} → ` : ""}${article.title}**](${getNewsUrl(
                    article.slug,
                )})`,
                "article",
            );

            if (isEdited && article.discordMessageId) {
                await enqueueNewsWebhook(buildNewsWebhook(article).editMessage(article.discordMessageId));
            }
        } catch (error) {
            console.error("Failed to update news post on Discord:", error);
        }
    }

    /** POST create article */
    public async createArticle(req: Request, res: Response) {
        const { title, content, type, isPublic } = req.body;

        if (!title || !content || !type) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (type === "news") {
            return res.status(400).json({ error: "News posts must be created from the news page" });
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

        if (article.type === "news") {
            return res.status(403).json({ error: "News posts cannot be deleted" });
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
