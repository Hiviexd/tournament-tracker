import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import Article from "@tc/models/articleModel";
import LogService from "@tc/models/LogService";
import config from "@tc/config";
import utils from "@tc/utils/server";
import type { IUser } from "@tc/types/User";

@Injectable()
export class ArticlesService {
    async getArticle(slug: string, user: IUser | undefined) {
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
            throw new NotFoundException("Article not found");
        }

        return article;
    }

    async getDocumentation(user: IUser | undefined) {
        if (!user?.isCommitteeOrAdmin) {
            throw new ForbiddenException("You don't have permission to view this");
        }

        return await Article.find({ type: "documentation" }).sort({ title: 1 });
    }

    async createArticle(
        body: { title?: string; content?: string; type?: string; isPublic?: boolean },
        user: IUser,
    ) {
        const { title, content, type, isPublic } = body;

        if (!title || !content || !type) {
            throw new BadRequestException("Missing required fields");
        }

        const article = new Article({
            title,
            content,
            type,
            isPublic,
            lastEditor: user,
        });

        await article.save();

        await LogService.generate(
            user.id,
            `Created a new ${article.type} article: [**${article.title}**](${config.baseUrl}/articles/${article.slug})`,
            "article",
        );

        return {
            message: "Article created successfully",
            article,
        };
    }

    async editArticle(slug: string, body: { title?: string; content?: string }, user: IUser) {
        const { title, content } = body;

        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        });

        if (!article) {
            throw new NotFoundException("Article not found");
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
            article.lastEditor = user;
        }

        await article.save();

        await LogService.generate(
            user.id,
            `Updated the ${article.type} article: [**${oldTitle ? `${oldTitle} → ` : ""}${article.title}**](${
                config.baseUrl
            }/articles/${article.slug})`,
            "article",
        );

        return {
            message: "Article updated successfully",
            article,
        };
    }

    async deleteArticle(slug: string, user: IUser) {
        const article = await Article.findOne({
            slug: { $regex: new RegExp(`^${utils.escapeRegexPattern(slug ?? "")}$`, "i") },
        });
        if (!article) {
            throw new NotFoundException("Article not found");
        }

        await article.deleteOne();

        await LogService.generate(
            user.id,
            `Deleted the ${article.type} article: [**${article.title}**](${config.baseUrl}/articles/${article.slug})`,
            "article",
        );

        return {
            message: "Article deleted successfully",
        };
    }
}
