import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { TournamentsModule } from "./modules/tournaments/tournaments.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
    imports: [AuthModule, UsersModule, TournamentsModule],
})
export class AppModule {}
