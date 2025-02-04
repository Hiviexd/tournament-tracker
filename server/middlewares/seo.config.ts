import TournamentModel from "../models/tournamentModel";
import VotingModel from "../models/votingModel";
import UserModel from "../models/userModel";
import _ from "lodash";

interface SEORoute {
    path: string;
    name: string;
    description?: string;
    isDynamic?: boolean;
    model?: string;
    modelId?: string;
    getMetadata?: (data: any) => Omit<SEOMetadata, "title">;
}

interface SEOMetadata {
    title: string;
    description: string;
    image?: string;
    ogSiteName?: string;
}

export const seoRoutes: SEORoute[] = [
    {
        path: "/",
        name: "Home",
    },
    {
        path: "/tournaments",
        name: "Tournaments Listing",
        description: "Browse the compendium of osu! tournaments and contests",
    },
    {
        path: "/tournaments/:tournamentId",
        name: "Tournament Details",
        isDynamic: true,
        model: "Tournament",
        modelId: "tournamentId",
        getMetadata: (tournament) => ({
            description: `${_.capitalize(tournament.type)} hosted by ${tournament.host.username}`,
            image: tournament.bannerUrl,
        }),
    },
    {
        path: "/votings",
        name: "Votings",
        description: "Browse committee votings and decisions"
    },
    {
        path: "/votings/:votingId",
        name: "Voting Details",
        isDynamic: true,
        model: "Voting",
        modelId: "votingId",
        getMetadata: (voting) => ({
            description: `${_.capitalize(voting.category)} voting by ${voting.author.username}`,
        }),
    },
    {
        path: "/users",
        name: "User Management",
        description: "Manage committee members and users",
    },
    {
        path: "/logs",
        name: "Logs",
        description: "View system activity logs",
    },
];

export const defaultMetadata: SEOMetadata = {
    title: "Tournament Tracker",
    description:
        "The one-stop shop for all official osu! tournament correspondence and information!",
    image: "/assets/logo-main.svg",
};

export const modelMap = {
    Tournament: TournamentModel,
    Voting: VotingModel,
    User: UserModel,
};

export type { SEORoute, SEOMetadata };
