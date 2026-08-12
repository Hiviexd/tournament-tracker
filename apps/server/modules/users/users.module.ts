import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { TournamentsModule } from "../tournaments/tournaments.module";

@Module({
    imports: [TournamentsModule],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule {}
