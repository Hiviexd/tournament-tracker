// Base
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider as StateProvider } from "jotai";

// Mantine
import { MantineProvider } from "@mantine/core";
import { theme } from "./themes/main";
import "@mantine/core/styles.css";

// Global functions
import http from "./modules/http";
import moment from "moment";

declare global {
    interface Window {
        $http: any;
        $moment: any;
    }
}

window.$http = http;
window.$moment = moment;

// Providers
import AuthProvider from "./providers/AuthProvider";

// Layouts
import Layout from "./layout/Layout";

// Pages
import HomePage from "./pages/HomePage";
import CommitteePage from "./pages/CommitteePage";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <StateProvider>
        <AuthProvider>
            <MantineProvider theme={theme}>
                <Router>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
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
        </AuthProvider>
    </StateProvider>
);
