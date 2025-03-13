import { Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
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

interface RouteConfig {
    path: string;
    page: JSX.Element;
    title: string;
    icon: string;
    permissions?: string[];
    parent?: {
        title: string;
        path: string;
    };
}

const routes: RouteConfig[] = [
    {
        path: "/",
        page: <HomePage />,
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
        icon: "users",
        permissions: ["admin"],
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
        page: <ArticlePage />,
        title: "Official Resources",
        icon: "file-alt",
        permissions: [],
    },
    {
        path: "/resources/community",
        page: <ArticlePage />,
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
        path: "*",
        page: <NotFoundPage />,
        title: "404",
        icon: "exclamation-triangle",
        permissions: [],
    },
];

export default routes;
