import { Module } from "@nestjs/common";
import { TicketsNestController } from "./tickets.controller";

@Module({
    controllers: [TicketsNestController],
})
export class TicketsModule {}
