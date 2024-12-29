// Base
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider as StateProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Mantine
import { MantineProvider } from "@mantine/core";
import { theme } from "./themes/main";
import loadIcons from "./themes/icons";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./sass/app.scss";

// Layout
import Layout from "./base/Layout";
import ProtectedRoute from "./base/ProtectedRoute";

// Fontawesome icons
loadIcons();

// Pages
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import CommitteePage from "./pages/CommitteePage";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";
import VotingListPage from "./pages/VotingListPage";

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
                                    <Layout title="Home" icon="home" page={<HomePage />} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/committee"
                            element={
                                <ProtectedRoute permissions={["committee"]}>
                                    <Layout
                                        title="Committee"
                                        icon="users"
                                        page={<CommitteePage />}
                                    />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute permissions={["admin"]}>
                                    <Layout title="Admin" icon="user-shield" page={<AdminPage />} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user"
                            element={
                                <ProtectedRoute permissions={["user"]}>
                                    <Layout title="User" icon="user-friends" page={<UserPage />} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/voting"
                            element={
                                <ProtectedRoute permissions={["committee"]}>
                                    <Layout
                                        title="Voting"
                                        icon="poll-h"
                                        page={<VotingListPage />}
                                    />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="*"
                            element={
                                <ProtectedRoute>
                                    <Layout
                                        title="404"
                                        icon="exclamation-triangle"
                                        page={<NotFoundPage />}
                                    />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </MantineProvider>
        </QueryClientProvider>
    </StateProvider>
);
