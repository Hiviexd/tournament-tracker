import { Module } from "@nestjs/common";
import { DevNestController } from "./dev.controller";

@Module({
    controllers: [DevNestController],
})
export class DevModule {}
