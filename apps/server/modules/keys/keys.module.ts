import { Module } from "@nestjs/common";
import { KeysNestController } from "./keys.controller";

@Module({
    controllers: [KeysNestController],
})
export class KeysModule {}
