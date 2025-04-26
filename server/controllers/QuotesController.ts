import { Request, Response } from "express";
import Quote from "../models/quotesModel";
import User from "../models/userModel";

class QuotesController {
    /** GET a random quote */
    public async getRandomQuote(_: Request, res: Response) {
        const quotes = await Quote.find().populate("author", "username osuId");

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        res.json(randomQuote);
    }

    /** GET all quotes */
    public async getAllQuotes(_: Request, res: Response) {
        const quotes = await Quote.find().populate("author", "username osuId").sort({ createdAt: -1 });
        res.json(quotes);
    }

    /** POST create a quote */
    public async createQuote(req: Request, res: Response) {
        const { authorId, quote, creationDate } = req.body;
        let createdAt = new Date();

        if (!authorId) {
            return res.json({ error: "Author is required" });
        }

        if (!quote) {
            return res.json({ error: "Quote is required" });
        }

        if (creationDate) {
            createdAt = new Date(creationDate);
        }

        const author = await User.findById(authorId).orFail();

        if (!author) {
            return res.json({ error: "Author not found" });
        }

        const newQuote = await Quote.create({ author, quote, createdAt });
        res.json(newQuote);
    }
}

export default new QuotesController();
