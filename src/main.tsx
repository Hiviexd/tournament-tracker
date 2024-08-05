// Base
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider as StateProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Mantine
import { MantineProvider } from "@mantine/core";
import { theme } from "./themes/main";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./sass/app.scss";

// Global functions
import moment from "moment";

declare global {
    interface Window {
        $http: any;
        $moment: any;
    }
}

window.$moment = moment;

// Layout
import Layout from "./base/Layout";
import ProtectedRoute from "./base/ProtectedRoute";

// fontawesome icons
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import {
    faSignOutAlt,
    faUserCircle,
    faTrophy,
    faShieldAlt,
    faUserShield,
    faClipboard,
    faPaperPlane,
    faMailBulk,
    faInbox,
    faPlusCircle,
    faUsers,
    faNewspaper,
    faClipboardList,
    faUserFriends,
    faPollH,
    faVoteYea,
    faHome,
} from "@fortawesome/free-solid-svg-icons";

library.add(
    fab,
    faSignOutAlt,
    faUserCircle,
    faTrophy,
    faShieldAlt,
    faUserShield,
    faClipboard,
    faPaperPlane,
    faMailBulk,
    faInbox,
    faPlusCircle,
    faUsers,
    faNewspaper,
    faClipboardList,
    faUserFriends,
    faPollH,
    faVoteYea,
    faHome
);

// Pages
import HomePage from "./pages/HomePage";
import CommitteePage from "./pages/CommitteePage";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <StateProvider>
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="dark" theme={theme}>
                <Notifications />
                <Router>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Layout title="Home" page={<HomePage />} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/committee"
                            element={
                                <ProtectedRoute permissions={["committee"]}>
                                    <Layout title="Committee" page={<CommitteePage />} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute permissions={["admin"]}>
                                    <Layout title="Admin" page={<AdminPage />} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user"
                            element={
                                <ProtectedRoute permissions={["user"]}>
                                    <Layout title="User" page={<UserPage />} />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </MantineProvider>
        </QueryClientProvider>
    </StateProvider>
);
