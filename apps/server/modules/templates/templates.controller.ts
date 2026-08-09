import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { TemplatesService } from "./templates.service";

@Controller("templates")
@UseGuards(IsLoggedInGuard, IsCommitteeGuard)
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) {}

    @Get()
    index() {
        return this.templatesService.index();
    }

    @Post("create")
    create(
        @Body() body: { name?: string; content?: string; category?: string },
        @CurrentUser() currentUser: IUser,
    ) {
        return this.templatesService.create(body, currentUser);
    }

    @Put(":id/update")
    update(
        @Param("id") id: string,
        @Body() body: { name?: string; content?: string; category?: string },
        @CurrentUser() currentUser: IUser,
    ) {
        return this.templatesService.update(id, body, currentUser);
    }

    @Delete(":id/delete")
    delete(@Param("id") id: string, @CurrentUser() currentUser: IUser) {
        return this.templatesService.delete(id, currentUser);
    }
}
