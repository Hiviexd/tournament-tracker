import { Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ErrorPage from "../pages/ErrorPage";
import NotFoundPage from "../pages/NotFoundPage";
import VotingListPage from "../pages/VotingListPage";
import VotingPage from "../pages/VotingPage";
import MarkdownPage from "../pages/MarkdownPage";
import LogsPage from "../pages/LogsPage";
import UsersPage from "../pages/UsersPage";
import TournamentsListPage from "../pages/TournamentsListPage";
import TicketCreatePage from "../pages/TicketCreatePage";
import TicketsListPage from "../pages/TicketsListPage";
import TicketDetailsPage from "../pages/TicketDetailsPage";

interface RouteConfig {
    path: string;
    page: JSX.Element;
    title: string;
    icon: string;
    permissions?: string[];
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
        path: "/voting",
        page: <VotingListPage />,
        title: "Voting",
        icon: "poll-h",
        permissions: ["committee"],
    },
    {
        path: "/votings/:votingId",
        page: <VotingPage />,
        title: "Voting Details",
        icon: "poll-h",
        permissions: ["committee"],
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
        icon: "users",
        permissions: ["committee"],
    },
    {
        path: "/tournaments",
        page: <TournamentsListPage />,
        title: "Tournaments Listing",
        icon: "users",
        permissions: ["user"],
    },
    {
        path: "/tickets",
        page: <TicketsListPage />,
        title: "Tickets Listing",
        icon: "mail-bulk",
        permissions: ["user"],
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
        permissions: ["user"],
    },
    {
        path: "/reports/create",
        page: <TicketCreatePage />,
        title: "Create Report",
        icon: "flag",
        permissions: ["user"],
    },
    {
        path: "/tickets/:ticketId",
        page: <TicketDetailsPage />,
        title: "Ticket Details",
        icon: "flag",
        permissions: ["user"],
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
