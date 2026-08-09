import { Request, Response } from "express";
import startCase from "lodash/startCase.js";
import Template from "@tc/models/templateModel";
import LogService from "@tc/models/LogService";

class TemplatesController {
    /** GET all templates */
    public async index(_: Request, res: Response) {
        const templates = await Template.find().sort({ category: 1, name: 1 });
        res.json(templates);
    }

    /** POST create a new template */
    public async create(req: Request, res: Response) {
        const { name, content, category } = req.body;
        const currentUser = res.locals!.user!;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "Template name is required" });
        }

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ error: "Template content is required" });
        }

        if (!category || typeof category !== "string" || category.trim().length === 0) {
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
            if (!name || typeof name !== "string" || name.trim().length === 0) {
                return res.status(400).json({ error: "Template name is required" });
            }
            template.name = name.trim();
        }

        if (content !== undefined) {
            if (!content || typeof content !== "string" || content.trim().length === 0) {
                return res.status(400).json({ error: "Template content is required" });
            }
            template.content = content.trim();
        }

        if (category !== undefined) {
            if (!category || typeof category !== "string" || category.trim().length === 0) {
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

        await template.deleteOne();

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
}

export default new TemplatesController();
