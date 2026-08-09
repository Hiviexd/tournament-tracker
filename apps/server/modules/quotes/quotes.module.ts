import { Module } from "@nestjs/common";
import { QuotesNestController } from "./quotes.controller";

@Module({
    controllers: [QuotesNestController],
})
export class QuotesModule {}
