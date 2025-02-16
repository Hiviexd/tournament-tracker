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
import "@mantine/dates/styles.css";
import "./sass/app.scss";

// Layout
import Layout from "./base/Layout";
import ProtectedRoute from "./base/ProtectedRoute";
import routes from "./base/routes.config";

// Fontawesome icons
import loadIcons from "./themes/icons";
loadIcons();

// PWA
import { registerSW } from "virtual:pwa-register";

// Register service worker
if ("serviceWorker" in navigator) {
    const updateSW = registerSW({
        onNeedRefresh() {
            if (confirm("New content available. Reload?")) {
                updateSW();
            }
        },
    });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <StateProvider>
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="dark" theme={theme}>
                <Notifications />
                <Router>
                    <Routes>
                        {routes.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    <ProtectedRoute permissions={route.permissions}>
                                        <Layout title={route.title} icon={route.icon} page={route.page} />
                                    </ProtectedRoute>
                                }
                            />
                        ))}
                    </Routes>
                </Router>
            </MantineProvider>
        </QueryClientProvider>
    </StateProvider>
);
