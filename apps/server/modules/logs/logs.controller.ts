import { Controller, Get, Header, Query, StreamableFile, UseGuards } from "@nestjs/common";
import type { LogListQuery } from "@tc/types/Log";
import { IsAdminGuard, IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { LogsService } from "./logs.service";

@Controller("logs")
export class LogsController {
    constructor(private readonly logsService: LogsService) {}

    @Get()
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    index(@Query() query: LogListQuery) {
        return this.logsService.index(query);
    }

    @Get("export")
    @UseGuards(IsLoggedInGuard, IsAdminGuard)
    @Header("Content-Type", "text/csv")
    @Header("Content-Disposition", "attachment; filename=logs-export.csv")
    async exportCsv(): Promise<StreamableFile> {
        const csv = await this.logsService.exportCsv();
        return new StreamableFile(Buffer.from(csv));
    }
}
