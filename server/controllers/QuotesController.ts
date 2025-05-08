import { Request, Response } from "express";
import Quote from "../models/quotesModel";
import User from "../models/userModel";

class QuotesController {
    /** GET a random quote */
    public async getRandomQuote(_: Request, res: Response) {
        const quotes = await Quote.find().populate("author", "username osuId").select("-addedBy");

        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

        res.json(randomQuote);
    }

    /** GET all quotes */
    public async getAllQuotes(_: Request, res: Response) {
        const quotes = await Quote.find()
            .populate("author", "username osuId")
            .populate("addedBy", "username osuId")
            .sort({ createdAt: -1 });
        res.json(quotes);
    }

    /** POST create a quote */
    public async createQuote(req: Request, res: Response) {
        const { authorId, quote } = req.body;
        const currentUser = res.locals!.user!;

        if (!authorId) {
            return res.status(400).json({ error: "Author is required" });
        }

        if (!quote) {
            return res.status(400).json({ error: "Quote is required" });
        }

        const author = await User.findById(authorId);
        if (!author) {
            return res.status(404).json({ error: "Author not found" });
        }

        const newQuote = await Quote.create({ author, quote, addedBy: currentUser._id });
        res.json(newQuote);
    }
}

export default new QuotesController();
