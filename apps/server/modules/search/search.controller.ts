import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { OptionalAuthGuard } from "../guards/auth.guards";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get()
    @UseGuards(OptionalAuthGuard)
    index(@Query("query") query: unknown, @CurrentUser() currentUser?: IUser) {
        return this.searchService.index(query, currentUser);
    }
}
