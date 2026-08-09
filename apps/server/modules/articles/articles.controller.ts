import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { IsAdminGuard, IsCommitteeGuard, IsLoggedInGuard, OptionalAuthGuard } from "../guards/auth.guards";
import { ArticlesService } from "./articles.service";

@Controller("articles")
export class ArticlesController {
    constructor(private readonly articlesService: ArticlesService) {}

    @Get("documentation")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    getDocumentation(@CurrentUser() currentUser?: IUser) {
        return this.articlesService.getDocumentation(currentUser);
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    createArticle(
        @Body() body: { title?: string; content?: string; type?: string; isPublic?: boolean },
        @CurrentUser() currentUser: IUser,
    ) {
        return this.articlesService.createArticle(body, currentUser);
    }

    @Get(":slug")
    @UseGuards(OptionalAuthGuard)
    getArticle(@Param("slug") slug: string, @CurrentUser() currentUser?: IUser) {
        return this.articlesService.getArticle(slug, currentUser);
    }

    @Put(":slug/edit")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    editArticle(
        @Param("slug") slug: string,
        @Body() body: { title?: string; content?: string },
        @CurrentUser() currentUser: IUser,
    ) {
        return this.articlesService.editArticle(slug, body, currentUser);
    }

    @Delete(":slug/delete")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    deleteArticle(@Param("slug") slug: string, @CurrentUser() currentUser: IUser) {
        return this.articlesService.deleteArticle(slug, currentUser);
    }
}
