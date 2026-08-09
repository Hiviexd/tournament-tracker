import { Module } from "@nestjs/common";
import { ResourcesNestController } from "./resources.controller";

@Module({
    controllers: [ResourcesNestController],
})
export class ResourcesModule {}
