import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import type { ResourceCategory } from "@tc/types/Resource";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsCommitteeGuard, IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";
import { ResourcesIndexQuerySchema, type ResourcesIndexQuery } from "./dto/resources.dto";
import { ResourcesService } from "./resources.service";

@Controller("resources")
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) {}

    @Get()
    @UseGuards(RequireScopesGuard(["resources:read"]))
    index(@Query(ZodPipe(ResourcesIndexQuerySchema)) query: ResourcesIndexQuery) {
        return this.resourcesService.index(query);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    create(
        @Body()
        body: {
            title?: string;
            description?: string;
            category?: ResourceCategory;
            type?: string;
            link?: string;
            author?: string;
        },
        @CurrentUser() currentUser: IUser,
    ) {
        return this.resourcesService.create(body, currentUser);
    }

    @Put(":id/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    edit(
        @Param("id") id: string,
        @Body()
        body: {
            title?: string;
            description?: string;
            category?: ResourceCategory;
            link?: string;
            author?: string;
        },
        @CurrentUser() currentUser: IUser,
    ) {
        return this.resourcesService.edit(id, body, currentUser);
    }

    @Delete(":id/delete")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    delete(@Param("id") id: string, @CurrentUser() currentUser: IUser) {
        return this.resourcesService.delete(id, currentUser);
    }
}
