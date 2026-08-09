import { Module } from "@nestjs/common";
import { DevController } from "./dev.controller";
import { DevService } from "./dev.service";

@Module({
    controllers: [DevController],
    providers: [DevService],
})
export class DevModule {}
