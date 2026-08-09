import { BadRequestException, Injectable, NotFoundException, Inject } from "@nestjs/common";
import type { Model } from "mongoose";
import type { IUser } from "@tc/types/User";
import { QUOTE_MODEL, USER_MODEL } from "../common/database.tokens";

@Injectable()
export class QuotesService {
    constructor(
        @Inject(QUOTE_MODEL) private readonly quoteModel: Model<any>,
        @Inject(USER_MODEL) private readonly userModel: Model<IUser>,
    ) {}

    async getRandomQuote() {
        const quotes = await this.quoteModel.find().populate("author", "username osuId").select("-addedBy");
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    async getAllQuotes() {
        return this.quoteModel
            .find()
            .populate("author", "username osuId groups coverUrl")
            .populate("addedBy", "username osuId groups coverUrl")
            .sort({ createdAt: -1 });
    }

    async createQuote(authorId: string | undefined, quote: string | undefined, currentUser: IUser) {
        if (!authorId) {
            throw new BadRequestException("Author is required");
        }

        if (!quote) {
            throw new BadRequestException("Quote is required");
        }

        const author = await this.userModel.findById(authorId);
        if (!author) {
            throw new NotFoundException("Author not found");
        }

        return this.quoteModel.create({ author, quote, addedBy: currentUser._id });
    }
}
