// React
import { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RecoilRoot } from "recoil";

// Mantine
import { MantineProvider } from "@mantine/core";
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <RecoilRoot>
        <AuthProvider>
            <MantineProvider>
                <Suspense fallback={<div>Loading...</div>}>
                    <Router>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route
                                path="/committee"
                                element={<Layout permissions={["committee"]} page={<CommitteePage />} />}
                            />
                            <Route
                                path="/admin"
                                element={<Layout permissions={["admin"]} page={<AdminPage />} />}
                            />
                        </Routes>
                    </Router>
                </Suspense>
            </MantineProvider>
        </AuthProvider>
    </RecoilRoot>
);
