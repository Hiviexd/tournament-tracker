import { Module } from "@nestjs/common";
import { TemplatesNestController } from "./templates.controller";

@Module({
    controllers: [TemplatesNestController],
})
export class TemplatesModule {}
