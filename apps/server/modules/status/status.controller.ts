import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { StatusInfo } from "@tc/types/Status";
import { StatusService } from "./status.service";

@ApiTags("Status")
@Controller("status")
export class StatusController {
    constructor(private readonly statusService: StatusService) {}

    @Get()
    @ApiOperation({
        summary: "Service status",
        description: "Public health/version endpoint. No authentication required.",
    })
    getStatus(): StatusInfo {
        return this.statusService.getStatus();
    }
}
