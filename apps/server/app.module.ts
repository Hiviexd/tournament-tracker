import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { TournamentsModule } from "./modules/tournaments/tournaments.module";
import { UsersModule } from "./modules/users/users.module";
import { VotesModule } from "./modules/votes/votes.module";

@Module({
    imports: [AuthModule, UsersModule, TournamentsModule, TicketsModule, VotesModule],
})
export class AppModule {}
