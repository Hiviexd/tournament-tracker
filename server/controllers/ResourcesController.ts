import { Request, Response } from "express";
import Resource from "../models/resourceModel";
import LogService from "../services/LogService";
import User from "../models/userModel";
import utils from "../../utils";

const DEFAULT_POPULATE = [{ path: "author", select: "username osuId groups coverUrl country" }];

const DEFAULT_LIMIT = 20;

class ResourcesController {
    /** GET resources listing with search and filters */
    public async index(req: Request, res: Response) {
        try {
            const { search, author, category, type, page = 1 } = req.query;

            const query: any = {};

            // Handle text search (title and description)
            if (search) {
                const escaped = utils.escapeRegexPattern(search as string);
                query.$or = [
                    { title: new RegExp(escaped, "i") },
                    { description: new RegExp(escaped, "i") },
                ];
            }

            // Handle filters
            if (author) {
                const user = await User.findByUsernameOrOsuId(author as string);
                if (user) query.author = user._id;
            }
            if (category) {
                query.category = category;
            }
            if (type) {
                query.type = type;
            }

            // Get paginated results
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
                    // Remove the temporary sorting field
                    { $project: { categoryOrder: 0 } },
                ])
                    .exec()
                    .then((resources) =>
                        // Populate after aggregation
                        Resource.populate(resources, DEFAULT_POPULATE),
                    ),
                Resource.countDocuments(query),
            ]);

            return res.json({
                resources,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / DEFAULT_LIMIT),
                },
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /** POST create new resource */
    public async create(req: Request, res: Response) {
        try {
            const user = res.locals!.user!;

            const { title, description, category, type, link, author } = req.body;

            // Validate required fields
            if (!title || !description || !category || !type || !link) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            if (!utils.isValidUrl(link)) {
                return res.status(400).json({ error: "Resource link must be a valid URL" });
            }

            // Create new resource
            const resource = await Resource.create({
                title,
                description,
                category,
                type,
                link,
            });

            if (author) {
                resource.author = author;
            }

            await resource.save();

            // Log the creation
            await LogService.generate(user.id, `Created resource: **${title}**`, "resource");

            return res.json({
                resource: resource.populate(DEFAULT_POPULATE),
                message: "Resource created successfully!",
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /** PUT edit resource */
    public async edit(req: Request, res: Response) {
        try {
            const user = res.locals!.user!;
            const { id } = req.params;
            const { title, description, category, link, author } = req.body;

            // Find the resource
            const resource = await Resource.findById(id).populate(DEFAULT_POPULATE);
            if (!resource) {
                return res.status(404).json({ error: "Resource not found" });
            }

            // Validate required fields
            if (!title || !description || !category || !link) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            if (!utils.isValidUrl(link)) {
                return res.status(400).json({ error: "Resource link must be a valid URL" });
            }

            // Update the resource
            resource.title = title;
            resource.description = description;
            resource.category = category;
            resource.link = link;

            if (author) {
                resource.author = author;
            }

            await resource.save();

            // Log the edit
            await LogService.generate(user.id, `Edited resource: **${title}**`, "resource");

            return res.json({
                resource: resource.populate(DEFAULT_POPULATE),
                message: "Resource updated successfully!",
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    /** POST delete resource */
    public async delete(req: Request, res: Response) {
        try {
            const user = res.locals!.user!;
            const { id } = req.params;

            const resource = await Resource.findById(id);
            if (!resource) {
                return res.status(404).json({ error: "Resource not found" });
            }

            await resource.deleteOne();

            await LogService.generate(user.id, `Deleted resource: **${resource.title}**`, "resource");

            return res.json({ message: "Resource deleted successfully!" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default new ResourcesController();
