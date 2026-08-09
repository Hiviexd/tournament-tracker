import { Module } from "@nestjs/common";
import { ArticlesModule } from "./modules/articles/articles.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BeatmapsModule } from "./modules/beatmaps/beatmaps.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DevModule } from "./modules/dev/dev.module";
import { InfringementsModule } from "./modules/infringements/infringements.module";
import { KeysModule } from "./modules/keys/keys.module";
import { LogsModule } from "./modules/logs/logs.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { SearchModule } from "./modules/search/search.module";
import { StatusModule } from "./modules/status/status.module";
import { TemplatesModule } from "./modules/templates/templates.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { TournamentsModule } from "./modules/tournaments/tournaments.module";
import { UsersModule } from "./modules/users/users.module";
import { VotesModule } from "./modules/votes/votes.module";

@Module({
    imports: [
        AuthModule,
        UsersModule,
        TournamentsModule,
        TicketsModule,
        VotesModule,
        ArticlesModule,
        ResourcesModule,
        TemplatesModule,
        InfringementsModule,
        KeysModule,
        ComplianceModule,
        BeatmapsModule,
        LogsModule,
        QuotesModule,
        DashboardModule,
        SearchModule,
        StatusModule,
        DevModule,
    ],
})
export class AppModule {}
