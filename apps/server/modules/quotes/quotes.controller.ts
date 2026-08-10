import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { IUser } from "@tc/types/User";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodPipe } from "../common/pipes/zod-validation.pipe";
import { IsCommitteeGuard, IsLoggedInGuard } from "../guards/auth.guards";
import { QuotesCreateBodySchema, type QuotesCreateBody } from "./dto/quotes.dto";
import { QuotesService } from "./quotes.service";

@Controller("quotes")
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) {}

    @Get()
    getRandomQuote() {
        return this.quotesService.getRandomQuote();
    }

    @Get("all")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    getAllQuotes() {
        return this.quotesService.getAllQuotes();
    }

    @Post("create")
    @UseGuards(IsLoggedInGuard, IsCommitteeGuard)
    createQuote(
        @Body(ZodPipe(QuotesCreateBodySchema)) body: QuotesCreateBody,
        @CurrentUser() currentUser: IUser,
    ) {
        return this.quotesService.createQuote(body.authorId, body.quote, currentUser);
    }
}
