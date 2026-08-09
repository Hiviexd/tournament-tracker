import { BadRequestException, Injectable } from "@nestjs/common";
import startCase from "lodash/startCase.js";
import Template from "@tc/models/templateModel";
import LogService from "@tc/models/LogService";
import type { IUser } from "@tc/types/User";

@Injectable()
export class TemplatesService {
    async index() {
        return Template.find().sort({ category: 1, name: 1 });
    }

    async create(body: { name?: string; content?: string; category?: string }, currentUser: IUser) {
        const { name, content, category } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            throw new BadRequestException("Template name is required");
        }

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            throw new BadRequestException("Template content is required");
        }

        if (!category || typeof category !== "string" || category.trim().length === 0) {
            throw new BadRequestException("Category is required");
        }

        const template = new Template({
            name,
            content,
            category: startCase(category.toLowerCase()),
        });

        await template.save();

        await LogService.generate(
            currentUser.id,
            `Created template **${template.name}** in category **${template.category}**`,
            "ticket",
        );

        return {
            message: "Template created successfully!",
            template,
        };
    }

    async update(
        id: string,
        body: { name?: string; content?: string; category?: string },
        currentUser: IUser,
    ) {
        const { name, content, category } = body;

        const template = await Template.findById(id).orFail();

        if (name !== undefined) {
            if (!name || typeof name !== "string" || name.trim().length === 0) {
                throw new BadRequestException("Template name is required");
            }
            template.name = name.trim();
        }

        if (content !== undefined) {
            if (!content || typeof content !== "string" || content.trim().length === 0) {
                throw new BadRequestException("Template content is required");
            }
            template.content = content.trim();
        }

        if (category !== undefined) {
            if (!category || typeof category !== "string" || category.trim().length === 0) {
                throw new BadRequestException("Category is required");
            }
            template.category = startCase(category.toLowerCase().trim());
        }

        await template.save();

        await LogService.generate(
            currentUser.id,
            `Updated template **${template.name}** in category **${template.category}**`,
            "ticket",
        );

        return {
            message: "Template updated successfully!",
            template,
        };
    }

    async delete(id: string, currentUser: IUser) {
        const template = await Template.findById(id).orFail();

        await template.deleteOne();

        await LogService.generate(
            currentUser.id,
            `Deleted template **${template.name}** from category **${template.category}**`,
            "ticket",
        );

        return {
            message: "Template deleted successfully!",
        };
    }
}
