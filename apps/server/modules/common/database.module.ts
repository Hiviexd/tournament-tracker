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
import Voting from "@tc/models/votingModel";
import Vote from "@tc/models/voteModel";
import Log from "@tc/models/logModel";
import Resource from "@tc/models/resourceModel";
import Template from "@tc/models/templateModel";
import Message from "@tc/models/messageModel";
import Review from "@tc/models/reviewModel";
import Attachment from "@tc/models/attachmentModel";
import Infringement from "@tc/models/infringementModel";
import NotificationJob from "@tc/models/notificationJobModel";
import utils from "@tc/utils/server";
import {
    API_KEY_MODEL,
    ARTICLE_MODEL,
    ATTACHMENT_MODEL,
    INFRINGEMENT_MODEL,
    LOG_MODEL,
    MESSAGE_MODEL,
    NOTIFICATION_JOB_MODEL,
    QUOTE_MODEL,
    RESOURCE_MODEL,
    REVIEW_MODEL,
    TEMPLATE_MODEL,
    TICKET_MODEL,
    TOURNAMENT_MODEL,
    USER_MODEL,
    VOTE_MODEL,
    VOTING_MODEL,
} from "./database.tokens";

const modelProviders = [
    { provide: USER_MODEL, useValue: User },
    { provide: QUOTE_MODEL, useValue: Quote },
    { provide: TOURNAMENT_MODEL, useValue: Tournament },
    { provide: TICKET_MODEL, useValue: Ticket },
    { provide: ARTICLE_MODEL, useValue: Article },
    { provide: API_KEY_MODEL, useValue: ApiKey },
    { provide: VOTING_MODEL, useValue: Voting },
    { provide: VOTE_MODEL, useValue: Vote },
    { provide: LOG_MODEL, useValue: Log },
    { provide: RESOURCE_MODEL, useValue: Resource },
    { provide: TEMPLATE_MODEL, useValue: Template },
    { provide: MESSAGE_MODEL, useValue: Message },
    { provide: REVIEW_MODEL, useValue: Review },
    { provide: ATTACHMENT_MODEL, useValue: Attachment },
    { provide: INFRINGEMENT_MODEL, useValue: Infringement },
    { provide: NOTIFICATION_JOB_MODEL, useValue: NotificationJob },
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
