import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsCommitteeGuard, IsLoggedInGuard, RequireScopesGuard } from "../guards/auth.guards";
import {
    ResourcesCreateBodySchema,
    ResourcesEditBodySchema,
    ResourcesIndexQuerySchema,
    type ResourcesCreateBody,
    type ResourcesEditBody,
    type ResourcesIndexQuery,
} from "./dto/resources.dto";
import { ResourcesService } from "./resources.service";

@ApiTags("Resources")
@Controller("resources")
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) {}

    @Get()
    @ApiBearerAuth("bearerAuth")
    @ApiOperation({ summary: "Get resources" })
    @UseGuards(RequireScopesGuard(["resources:read"]))
    index(@Query(ZodPipe(ResourcesIndexQuerySchema)) query: ResourcesIndexQuery) {
        return this.resourcesService.index(query);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    create(
        @Body(ZodPipe(ResourcesCreateBodySchema)) body: ResourcesCreateBody,
        @CurrentUser() currentUser: IUser,
    ) {
        return this.resourcesService.create(body, currentUser);
    }

    @Put(":id/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    edit(
        @Param("id") id: string,
        @Body(ZodPipe(ResourcesEditBodySchema)) body: ResourcesEditBody,
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
