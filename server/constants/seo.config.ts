// import TournamentModel from "../models/tournamentModel";
import VotingModel from "../models/votingModel";
import TicketModel from "../models/ticketModel";
import _ from "lodash";

interface SEORoute {
    path: string;
    name: string;
    description?: string;
    isDynamic?: boolean;
    model?: string;
    modelId?: string;
    getMetadata?: (data: any) => SEOMetadata;
}

interface SEOMetadata {
    title?: string;
    description: string;
    image?: string;
    ogSiteName?: string;
}

export const seoRoutes: SEORoute[] = [
    {
        path: "/",
        name: "Home",
    },
    // {
    //     path: "/tournaments",
    //     name: "Tournaments Listing",
    //     description: "Browse the compendium of osu! tournaments and contests",
    // },
    // {
    //     path: "/tournaments/:tournamentId",
    //     name: "Tournament Details",
    //     isDynamic: true,
    //     model: "Tournament",
    //     modelId: "tournamentId",
    //     getMetadata: (tournament) => ({
    //         description: `${_.capitalize(tournament.type)} hosted by ${tournament.host.username}`,
    //         image: tournament.bannerUrl,
    //     }),
    // },
    {
        path: "/votes",
        name: "Votes Listing",
        description: "Browse committee votes and decisions.",
    },
    {
        path: "/votes/:votingId",
        name: "Vote Details",
        isDynamic: true,
        model: "Voting",
        modelId: "votingId",
        getMetadata: (voting) => ({
            description: `${_.capitalize(voting.category)} vote by ${voting.author.username}`,
        }),
    },
    {
        path: "/users",
        name: "User Management",
        description: "Manage committee members and users.",
    },
    {
        path: "/logs",
        name: "Logs",
        description: "View system activity logs.",
    },
    {
        path: "/tickets",
        name: "Tickets Listing",
        description: "Browse through the compendium of tickets created by users!",
    },
    {
        path: "/tickets/create",
        name: "Create Ticket",
        description: "Create a new ticket whether you have a simple question or need help with a specific issue!",
    },
    {
        path: "/reports",
        name: "Reports Listing",
        description: "View reports submitted by users.",
    },
    {
        path: "/reports/create",
        name: "Create Report",
        description:
            "The tournament report form is the prime way to report any issues or concerns you have with a tournament or one of its players!",
    },
    {
        path: "/tickets/:ticketId",
        name: "Ticket Details",
        isDynamic: true,
        model: "Ticket",
        modelId: "ticketId",
        getMetadata: (ticket) => {
            return {
                title: `${ticket.title} - ${_.capitalize(ticket.type)} Details`,
                description: ticket.type === "ticket" ? `Ticket created by ${ticket.author.username}`: `View and discuss this report.`,
            };
        },
    },
    {
        path: "/reports/:ticketId",
        name: "Report Details",
        isDynamic: true,
        model: "Ticket",
        modelId: "ticketId",
        getMetadata: (ticket) => {
            return {
                title: `${ticket.title} - ${_.capitalize(ticket.type)} Details`,
                description: `View and discuss this report.`,
            };
        },
    },
    {
        path: "/assets-previewer",
        name: "Assets Previewer",
        description: "Preview how badges, news banners, and in-game banners will look like in the osu! website!",
    },
];

export const defaultMetadata: SEOMetadata = {
    title: "Tournament Tracker",
    description: "The one-stop shop for all official osu! tournament correspondence and information!",
    // image: "https://tcomm.hivie.tn/assets/logo-512.png",
};

export const modelMap = {
    Voting: VotingModel,
    Ticket: TicketModel,
};

export type { SEORoute, SEOMetadata };
