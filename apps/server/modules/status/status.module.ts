import { Module } from "@nestjs/common";
import { StatusController } from "./status.controller";
import { StatusService } from "./status.service";
import { VersionService } from "../../services/VersionService";

@Module({
    controllers: [StatusController],
    providers: [StatusService, VersionService],
})
export class StatusModule {}
