import { Controller, Get } from "@nestjs/common";
import type { StatusInfo } from "@tc/types/Status";
import { StatusService } from "./status.service";

@Controller("status")
export class StatusController {
    constructor(private readonly statusService: StatusService) {}

    @Get()
    getStatus(): StatusInfo {
        return this.statusService.getStatus();
    }
}
