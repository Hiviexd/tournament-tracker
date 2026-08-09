import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import Resource from "@tc/models/resourceModel";
import LogService from "@tc/models/LogService";
import User from "@tc/models/userModel";
import utils from "@tc/utils/server";
import type { ResourceCategory } from "@tc/types/Resource";
import type { IUser } from "@tc/types/User";

const DEFAULT_POPULATE = [{ path: "author", select: "username osuId groups coverUrl country" }];
const DEFAULT_LIMIT = 20;

@Injectable()
export class ResourcesService {
    async index(queryParams: {
        search?: string;
        author?: string;
        category?: string;
        type?: string;
        page?: string | number;
    }) {
        const { search, author, category, type, page = 1 } = queryParams;

        const query: any = {};

        if (search) {
            const escaped = utils.escapeRegexPattern(search);
            query.$or = [{ title: new RegExp(escaped, "i") }, { description: new RegExp(escaped, "i") }];
        }

        if (author) {
            const user = await User.findByUsernameOrOsuId(author);
            if (user) query.author = user._id;
        }
        if (category) {
            query.category = category;
        }
        if (type) {
            query.type = type;
        }

        const skip = (Number(page) - 1) * DEFAULT_LIMIT;

        const [resources, total] = await Promise.all([
            Resource.aggregate([
                { $match: query },
                {
                    $addFields: {
                        categoryOrder: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$category", "article"] }, then: 1 },
                                    { case: { $eq: ["$category", "discord"] }, then: 2 },
                                    { case: { $eq: ["$category", "spreadsheet"] }, then: 3 },
                                    { case: { $eq: ["$category", "tool"] }, then: 4 },
                                    { case: { $eq: ["$category", "guide"] }, then: 5 },
                                ],
                                default: 6,
                            },
                        },
                    },
                },
                { $sort: { categoryOrder: 1, createdAt: 1 } },
                { $skip: skip },
                { $limit: DEFAULT_LIMIT },
                { $project: { categoryOrder: 0 } },
            ])
                .exec()
                .then((docs) => Resource.populate(docs, DEFAULT_POPULATE)),
            Resource.countDocuments(query),
        ]);

        return {
            resources,
            pagination: {
                current: Number(page),
                total: Math.ceil(total / DEFAULT_LIMIT),
            },
        };
    }

    async create(
        body: {
            title?: string;
            description?: string;
            category?: ResourceCategory;
            type?: string;
            link?: string;
            author?: string;
        },
        user: IUser,
    ) {
        const { title, description, category, type, link, author } = body;

        if (!title || !description || !category || !type || !link) {
            throw new BadRequestException("Missing required fields");
        }

        if (!utils.isValidUrl(link)) {
            throw new BadRequestException("Resource link must be a valid URL");
        }

        const resource = await Resource.create({
            title,
            description,
            category,
            type,
            link,
        });

        if (author) {
            resource.author = author as any;
        }

        await resource.save();

        await LogService.generate(user.id, `Created resource: **${title}**`, "resource");

        return {
            resource: await resource.populate(DEFAULT_POPULATE),
            message: "Resource created successfully!",
        };
    }

    async edit(
        id: string,
        body: {
            title?: string;
            description?: string;
            category?: ResourceCategory;
            link?: string;
            author?: string;
        },
        user: IUser,
    ) {
        const { title, description, category, link, author } = body;

        const resource = await Resource.findById(id).populate(DEFAULT_POPULATE);
        if (!resource) {
            throw new NotFoundException("Resource not found");
        }

        if (!title || !description || !category || !link) {
            throw new BadRequestException("Missing required fields");
        }

        if (!utils.isValidUrl(link)) {
            throw new BadRequestException("Resource link must be a valid URL");
        }

        resource.title = title;
        resource.description = description;
        resource.category = category;
        resource.link = link;

        if (author) {
            resource.author = author as any;
        }

        await resource.save();

        await LogService.generate(user.id, `Edited resource: **${title}**`, "resource");

        return {
            resource: await resource.populate(DEFAULT_POPULATE),
            message: "Resource updated successfully!",
        };
    }

    async delete(id: string, user: IUser) {
        const resource = await Resource.findById(id);
        if (!resource) {
            throw new NotFoundException("Resource not found");
        }

        await resource.deleteOne();

        await LogService.generate(user.id, `Deleted resource: **${resource.title}**`, "resource");

        return { message: "Resource deleted successfully!" };
    }
}
