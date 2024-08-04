// Base
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider as StateProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Mantine
import { MantineProvider } from "@mantine/core";
import { theme } from "./themes/main";
import "@mantine/core/styles.css";

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
            <MantineProvider theme={theme}>
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
        </QueryClientProvider>
    </StateProvider>
);
