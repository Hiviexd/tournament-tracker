import { Controller, Get, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    index(@CurrentUser() currentUser?: IUser) {
        return this.dashboardService.index(currentUser);
    }
}
