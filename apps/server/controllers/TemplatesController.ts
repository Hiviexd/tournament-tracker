import { Request, Response } from "express";
import startCase from "lodash/startCase.js";
import { isString } from "@tc/utils/common";
import Template from "../models/templateModel";
import LogService from "../services/LogService";
import { WITH_DELETED, deletedVisibility, restoreDeleted, softDelete } from "../plugins/softDeletePlugin";

class TemplatesController {
    /** GET all templates */
    public async index(_: Request, res: Response) {
        const templates = await Template.find()
            .setOptions(deletedVisibility(res.locals!.user))
            .sort({ category: 1, name: 1 });
        res.json(templates);
    }

    /** POST create a new template */
    public async create(req: Request, res: Response) {
        const { name, content, category } = req.body;
        const currentUser = res.locals!.user!;

        if (!isString(name) || name.trim().length === 0) {
            return res.status(400).json({ error: "Template name is required" });
        }

        if (!isString(content) || content.trim().length === 0) {
            return res.status(400).json({ error: "Template content is required" });
        }

        if (!isString(category) || category.trim().length === 0) {
            return res.status(400).json({ error: "Category is required" });
        }

        const template = new Template({
            name,
            content,
            category: startCase(category.toLowerCase()),
        });

        await template.save();

        res.json({
            message: "Template created successfully!",
            template,
        });

        // Logger
        await LogService.generate(
            currentUser.id,
            `Created template **${template.name}** in category **${template.category}**`,
            "ticket",
        );
    }

    /** PUT update a template */
    public async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, content, category } = req.body;
        const currentUser = res.locals!.user!;

        const template = await Template.findById(id).orFail();

        if (name !== undefined) {
            if (!isString(name) || name.trim().length === 0) {
                return res.status(400).json({ error: "Template name is required" });
            }
            template.name = name.trim();
        }

        if (content !== undefined) {
            if (!isString(content) || content.trim().length === 0) {
                return res.status(400).json({ error: "Template content is required" });
            }
            template.content = content.trim();
        }

        if (category !== undefined) {
            if (!isString(category) || category.trim().length === 0) {
                return res.status(400).json({ error: "Category is required" });
            }
            template.category = startCase(category.toLowerCase().trim());
        }

        await template.save();

        res.json({
            message: "Template updated successfully!",
            template,
        });

        // Logger
        await LogService.generate(
            currentUser.id,
            `Updated template **${template.name}** in category **${template.category}**`,
            "ticket",
        );
    }

    /** DELETE a template */
    public async delete(req: Request, res: Response) {
        const { id } = req.params;
        const currentUser = res.locals!.user!;

        const template = await Template.findById(id).orFail();

        await softDelete(template, currentUser._id);

        res.json({
            message: "Template deleted successfully!",
        });

        // Logger
        await LogService.generate(
            currentUser.id,
            `Deleted template **${template.name}** from category **${template.category}**`,
            "ticket",
        );
    }

    /** POST restore a soft-deleted template */
    public async restore(req: Request, res: Response) {
        const { id } = req.params;
        const currentUser = res.locals!.user!;

        const template = await Template.findById(id).setOptions(WITH_DELETED).orFail();

        if (!template.deletedAt) {
            return res.status(400).json({ error: "Template is not deleted" });
        }

        await restoreDeleted(template);

        res.json({
            message: "Template restored successfully!",
            template,
        });

        // Logger
        await LogService.generate(
            currentUser.id,
            `Restored template **${template.name}** in category **${template.category}**`,
            "ticket",
        );
    }
}

export default new TemplatesController();
