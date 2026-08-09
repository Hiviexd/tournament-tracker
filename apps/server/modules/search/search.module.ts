import { Module } from "@nestjs/common";
import { SearchNestController } from "./search.controller";

@Module({
    controllers: [SearchNestController],
})
export class SearchModule {}
