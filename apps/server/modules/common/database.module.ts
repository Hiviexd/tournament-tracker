import { Global, Module, OnModuleInit } from "@nestjs/common";
import mongoose from "mongoose";
import config from "@tc/config";
import { initMongoose } from "@tc/models/init";
import User from "@tc/models/userModel";
import Quote from "@tc/models/quotesModel";
import Tournament from "@tc/models/tournamentModel";
import Ticket from "@tc/models/ticketModel";
import Article from "@tc/models/articleModel";
import ApiKey from "@tc/models/apiKeyModel";
import utils from "@tc/utils/server";
import {
    API_KEY_MODEL,
    ARTICLE_MODEL,
    QUOTE_MODEL,
    TICKET_MODEL,
    TOURNAMENT_MODEL,
    USER_MODEL,
} from "./database.tokens";

const modelProviders = [
    { provide: USER_MODEL, useValue: User },
    { provide: QUOTE_MODEL, useValue: Quote },
    { provide: TOURNAMENT_MODEL, useValue: Tournament },
    { provide: TICKET_MODEL, useValue: Ticket },
    { provide: ARTICLE_MODEL, useValue: Article },
    { provide: API_KEY_MODEL, useValue: ApiKey },
];

@Global()
@Module({
    providers: modelProviders,
    exports: modelProviders,
})
export class DatabaseModule implements OnModuleInit {
    async onModuleInit(): Promise<void> {
        initMongoose();

        mongoose.connection.on(
            "error",
            console.error.bind(console, utils.consoleStyles("✗ Database connection error", ["red", "underline"])),
        );
        mongoose.connection.once("open", function () {
            console.log(utils.consoleStyles("✓ Database connected", ["green", "bold", "underline"]));
        });

        await mongoose.connect(config.connection);
    }
}
