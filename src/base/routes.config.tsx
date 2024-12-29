import HomePage from "../pages/HomePage";
import CommitteePage from "../pages/CommitteePage";
import AdminPage from "../pages/AdminPage";
import UserPage from "../pages/UserPage";
import VotingListPage from "../pages/VotingListPage";
import NotFoundPage from "../pages/NotFoundPage";

interface RouteConfig {
    path: string;
    component: JSX.Element;
    title: string;
    icon: string;
    permissions?: string[];
}

const routes: RouteConfig[] = [
    {
        path: "/",
        component: <HomePage />,
        title: "Home",
        icon: "home",
    },
    {
        path: "/committee",
        component: <CommitteePage />,
        title: "Committee",
        icon: "users",
        permissions: ["committee"],
    },
    {
        path: "/admin",
        component: <AdminPage />,
        title: "Admin",
        icon: "user-shield",
        permissions: ["admin"],
    },
    {
        path: "/user",
        component: <UserPage />,
        title: "User",
        icon: "user-friends",
        permissions: ["user"],
    },
    {
        path: "/voting",
        component: <VotingListPage />,
        title: "Voting",
        icon: "poll-h",
        permissions: ["committee"],
    },
    {
        path: "*",
        component: <NotFoundPage />,
        title: "404",
        icon: "exclamation-triangle",
    },
];

export default routes;
