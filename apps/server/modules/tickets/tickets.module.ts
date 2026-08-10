import { Module } from "@nestjs/common";
import { TicketService } from "../../services/TicketService";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { UploadModule } from "../common/upload.module";

@Module({
    imports: [UploadModule],
    controllers: [TicketsController],
    providers: [TicketsService, TicketService],
    exports: [TicketService],
})
export class TicketsModule {}
