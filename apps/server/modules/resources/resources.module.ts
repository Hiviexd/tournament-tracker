import { Module } from "@nestjs/common";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";

@Module({
    controllers: [ResourcesController],
    providers: [ResourcesService],
})
export class ResourcesModule {}
