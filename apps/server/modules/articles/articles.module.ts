import { Module } from "@nestjs/common";
import { ArticlesNestController } from "./articles.controller";

@Module({
    controllers: [ArticlesNestController],
})
export class ArticlesModule {}
