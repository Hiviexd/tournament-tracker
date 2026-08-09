import { Module } from "@nestjs/common";
import { UsersNestController } from "./users.controller";

@Module({
    controllers: [UsersNestController],
})
export class UsersModule {}
