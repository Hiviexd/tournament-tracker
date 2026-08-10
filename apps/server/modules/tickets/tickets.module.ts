import { Module } from "@nestjs/common";
import { TicketDomainService } from "../../services/TicketDomainService";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { UploadModule } from "../common/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [TicketsController],
    providers: [TicketsService, TicketDomainService],
    exports: [TicketDomainService],
})
export class TicketsModule {}
