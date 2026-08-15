import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import HomeHero from "../components/home/HomeHero";
import ErrorPage from "../pages/ErrorPage";
import NotFoundPage from "../pages/NotFoundPage";
import VotingListPage from "../pages/VotingListPage";
import VotingDetailsPage from "../pages/VotingDetailsPage";
import MarkdownPage from "../pages/MarkdownPage";
import LogsPage from "../pages/LogsPage";
import UsersPage from "../pages/UsersPage";
import TournamentsListPage from "../pages/TournamentsListPage";
import TicketCreatePage from "../pages/TicketCreatePage";
import TicketsListPage from "../pages/TicketsListPage";
import TicketDetailsPage from "../pages/TicketDetailsPage";
import ArticlePage from "../pages/ArticlePage";
import DocumentationListPage from "../pages/DocumentationListPage";
import CreateArticlePage from "../pages/CreateArticlePage";
import AssetsPreviewerPage from "../pages/AssetsPreviewerPage";
import ResourcesPage from "../pages/ResourcesPage";
import MappoolCompliancePage from "../pages/MappoolCompliancePage";
import TournamentDetailsPage from "../pages/TournamentDetailsPage";
import QuotesPage from "../pages/QuotesPage";
import TemplatesPage from "../pages/TemplatesPage";
import DashboardPage from "../pages/DashboardPage";
import ApiKeysPage from "../pages/ApiKeysPage";
import WatchlistPage from "../pages/WatchlistPage";
import NotificationJobsPage from "../pages/NotificationJobsPage";
import ChecklistPage from "../pages/ChecklistPage";

interface RouteConfig {
    path: string;
    page: React.ReactNode;
    title: string;
    icon: IconProp;
    permissions?: string[];
    parent?: {
        title: string;
        path: string;
    };
    banner?: React.ReactNode;
}

const routes: RouteConfig[] = [
    {
        path: "/",
        page: <HomePage />,
        banner: <HomeHero />,
        title: "Home",
        icon: "home",
        permissions: [],
    },
    {
        path: "/home",
        page: <Navigate to="/" replace />,
        title: "Home",
        icon: "home",
        permissions: [],
    },
    {
        path: "/dashboard",
        page: <DashboardPage />,
        title: "Dashboard",
        icon: "table-columns",
        permissions: ["committee"],
    },
    {
        path: "/error",
        page: <ErrorPage />,
        title: "Error",
        icon: "exclamation-circle",
        permissions: [],
    },
    {
        path: "/votes",
        page: <VotingListPage />,
        title: "Votes Listing",
        icon: "poll-h",
        permissions: [],
    },
    {
        path: "/votes/:votingId",
        page: <VotingDetailsPage />,
        title: "Vote Details",
        icon: "poll-h",
        permissions: [],
        parent: {
            title: "Votes",
            path: "/votes",
        },
    },
    {
        path: "/markdown",
        page: <MarkdownPage />,
        title: "Markdown Playground",
        icon: "file-alt",
        permissions: [],
    },
    {
        path: "/logs",
        page: <LogsPage />,
        title: "Logs",
        icon: "history",
        permissions: ["committee"],
    },
    {
        path: "/users",
        page: <UsersPage />,
        title: "User Management",
        icon: "users-gear",
        permissions: ["committee"],
    },
    {
        path: "/tournaments",
        page: <TournamentsListPage />,
        title: "Tournaments Listing",
        icon: "trophy",
        permissions: [],
    },
    {
        path: "/tournaments/:tournamentId",
        page: <TournamentDetailsPage />,
        title: "Tournament Details",
        icon: "trophy",
        permissions: [],
        parent: {
            title: "Tournaments",
            path: "/tournaments",
        },
    },
    {
        path: "/tickets",
        page: <TicketsListPage />,
        title: "Tickets Listing",
        icon: "mail-bulk",
        permissions: [],
    },
    {
        path: "/reports",
        page: <TicketsListPage />,
        title: "Reports Listing",
        icon: "mail-bulk",
        permissions: ["user"],
    },
    {
        path: "/tickets/create",
        page: <TicketCreatePage />,
        title: "Create Ticket",
        icon: "paper-plane",
        permissions: [],
    },
    {
        path: "/reports/create",
        page: <TicketCreatePage />,
        title: "Create Report",
        icon: "flag",
        permissions: [],
    },
    {
        path: "/tickets/:ticketId",
        page: <TicketDetailsPage />,
        title: "Ticket Details",
        icon: "paper-plane",
        permissions: [],
        parent: {
            title: "Tickets",
            path: "/tickets",
        },
    },
    {
        path: "/reports/:ticketId",
        page: <TicketDetailsPage />,
        title: "Report Details",
        icon: "flag",
        permissions: ["user"],
        parent: {
            title: "Reports",
            path: "/reports",
        },
    },
    {
        path: "/docs",
        page: <DocumentationListPage />,
        title: "Documentation",
        icon: "book",
        permissions: ["committee"],
    },
    {
        path: "/docs/:slug",
        page: <ArticlePage />,
        title: "Article",
        icon: "book",
        permissions: ["committee"],
        parent: {
            title: "Documentation",
            path: "/docs",
        },
    },
    {
        path: "/resources/official",
        page: <ResourcesPage />,
        title: "Official Resources",
        icon: "file-alt",
        permissions: [],
    },
    {
        path: "/resources/community",
        page: <ResourcesPage />,
        title: "Community Resources",
        icon: "users",
        permissions: [],
    },
    {
        path: "/articles/create",
        page: <CreateArticlePage />,
        title: "Create Article",
        icon: "file-circle-plus",
        permissions: ["admin"],
    },
    {
        path: "/assets-previewer",
        page: <AssetsPreviewerPage />,
        title: "Assets Previewer",
        icon: "images",
        permissions: [],
    },
    {
        path: "/mappool-compliance",
        page: <MappoolCompliancePage />,
        title: "Mappool Compliance",
        icon: "check-circle",
        permissions: [],
    },
    {
        path: "/templates",
        page: <TemplatesPage />,
        title: "Templates",
        icon: "comment-dots",
        permissions: ["committee"],
    },
    {
        path: "/quotes",
        page: <QuotesPage />,
        title: "Quotes",
        icon: "quote-left",
        permissions: ["committee"],
    },
    {
        path: "/checklist",
        page: <ChecklistPage />,
        title: "Review Checklist",
        icon: "clipboard-list",
        permissions: ["committee"],
    },
    {
        path: "/keys",
        page: <ApiKeysPage />,
        title: "API Keys",
        icon: "key",
        permissions: ["dev"],
    },
    {
        path: "/notification-jobs",
        page: <NotificationJobsPage />,
        title: "Notification Jobs",
        icon: "bell",
        permissions: ["dev"],
    },
    {
        path: "/watchlist",
        page: <WatchlistPage />,
        title: "Watchlist",
        icon: "user-shield",
        permissions: ["committee"],
    },
    {
        path: "*",
        page: <NotFoundPage />,
        title: "404",
        icon: "exclamation-triangle",
        permissions: [],
    },
];

export default routes;
