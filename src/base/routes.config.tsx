import { Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import CommitteePage from "../pages/CommitteePage";
import AdminPage from "../pages/AdminPage";
import UserPage from "../pages/UserPage";
import VotingListPage from "../pages/VotingListPage";
import VotingPage from "../pages/VotingPage";
import MarkdownPlaygroundPage from "../pages/MarkdownPlaygroundPage";
import LogsPage from "../pages/LogsPage";

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
        path: "/committee",
        page: <CommitteePage />,
        title: "Committee",
        icon: "users",
        permissions: ["committee"],
    },
    {
        path: "/admin",
        page: <AdminPage />,
        title: "Admin",
        icon: "user-shield",
        permissions: ["admin"],
    },
    {
        path: "/user",
        page: <UserPage />,
        title: "User",
        icon: "user-friends",
        permissions: ["user"],
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
        page: <MarkdownPlaygroundPage />,
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
        path: "*",
        page: <NotFoundPage />,
        title: "404",
        icon: "exclamation-triangle",
        permissions: [],
    },
];

export default routes;
