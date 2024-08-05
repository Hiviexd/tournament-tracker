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

// Snackbar
import { SnackbarProvider } from "notistack";

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
import Layout from "./layout/Layout";

// Pages
import HomePage from "./pages/HomePage";
import CommitteePage from "./pages/CommitteePage";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <StateProvider>
        <QueryClientProvider client={queryClient}>
            <SnackbarProvider autoHideDuration={3000}>
                <MantineProvider defaultColorScheme="dark" theme={theme}>
                    <Notifications />
                    <Router>
                        <Routes>
                            <Route path="/" element={<Layout page={<HomePage />} />} />
                            <Route
                                path="/committee"
                                element={
                                    <Layout permissions={["committee"]} page={<CommitteePage />} />
                                }
                            />
                            <Route
                                path="/admin"
                                element={<Layout permissions={["admin"]} page={<AdminPage />} />}
                            />
                            <Route
                                path="/user"
                                element={<Layout permissions={["user"]} page={<UserPage />} />}
                            />
                        </Routes>
                    </Router>
                </MantineProvider>
            </SnackbarProvider>
        </QueryClientProvider>
    </StateProvider>
);
