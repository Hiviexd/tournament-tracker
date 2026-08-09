import { Module } from "@nestjs/common";
import { TicketService } from "../../services/TicketService";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";

@Module({
    controllers: [TicketsController],
    providers: [TicketsService, TicketService],
    exports: [TicketService],
})
export class TicketsModule {}
