import { Module } from "@nestjs/common";
import { LogsNestController } from "./logs.controller";

@Module({
    controllers: [LogsNestController],
})
export class LogsModule {}
