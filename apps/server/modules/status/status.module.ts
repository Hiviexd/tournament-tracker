import { Module } from "@nestjs/common";
import { StatusNestController } from "./status.controller";

@Module({
    controllers: [StatusNestController],
})
export class StatusModule {}
