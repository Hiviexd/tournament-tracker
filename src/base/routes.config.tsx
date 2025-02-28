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
import ReportImportPage from "../pages/ReportImportPage";

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
        path: "/votes",
        page: <VotingListPage />,
        title: "Votes Listing",
        icon: "poll-h",
        permissions: ["user"],
    },
    {
        path: "/votes/:votingId",
        page: <VotingDetailsPage />,
        title: "Vote Details",
        icon: "poll-h",
        permissions: ["user"],
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
        permissions: ["admin"],
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
        path: "/reports/import",
        page: <ReportImportPage />,
        title: "Import Reports",
        icon: "file-import",
        permissions: ["admin"],
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
