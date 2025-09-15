import { Request, Response } from "express";
import Tournament from "../models/tournamentModel";
import { ITournament } from "../../interfaces/Tournament";
import TournamentService from "../services/TournamentService";
import Voting from "../models/votingModel";
import { IVoting } from "../../interfaces/Voting";
import Ticket from "../models/ticketModel";
import { ITicket } from "../../interfaces/Ticket";
import Resource from "../models/resourceModel";
import { IResource } from "../../interfaces/Resource";
import Article from "../models/articleModel";
import { IArticle } from "../../interfaces/Article";

class GlobalSearchController {
    public async index(req: Request, res: Response) {
        const { query } = req.query;

        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "No valid search query provided" });
        }

        const tournamentSearchQuery = TournamentService.createSearchQuery(query as string);

        // Advanced tournament search
        const tournaments: ITournament[] = tournamentSearchQuery.$and
            ? await Tournament.find({ $and: tournamentSearchQuery.$and }).select("_id name").lean()
            : [];

        // Search votings via title or description
        const votings: IVoting[] = await Voting.find({
            $or: [
                { title: { $regex: query as string, $options: "i" } },
                { description: { $regex: query as string, $options: "i" } },
            ],
        })
            .select("_id title")
            .lean();

        // Search tickets via title
        const tickets: ITicket[] = await Ticket.find({
            type: "ticket",
            title: { $regex: query as string, $options: "i" },
        })
            .select("_id title")
            .lean();

        // Search reports via title
        const reports: ITicket[] = await Ticket.find({
            type: "report",
            title: { $regex: query as string, $options: "i" },
        })
            .select("_id title")
            .lean();

        // Search articles via title
        const articles: IArticle[] = await Article.find({
            title: { $regex: query as string, $options: "i" },
        })
            .select("_id title")
            .lean();

        // Search resources via title
        const resources: IResource[] = await Resource.find({
            title: { $regex: query as string, $options: "i" },
        })
            .select("_id title")
            .lean();

        res.json({
            tournaments,
            votings,
            tickets,
            reports,
            resources,
            articles,
        });
    }
}

export default new GlobalSearchController();
