// Base
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider as StateProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import ReactScan from "./components/base/ReactScan";
import VersionChecker from "./components/base/VersionChecker";
import Spotlight from "./components/common/Spotlight";
import SnowOverlay from "./components/base/SnowOverlay";

const queryClient = new QueryClient();

// Mantine
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { theme } from "./themes";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/spotlight/styles.css";

import "./sass/app.scss";

// Layout
import AuthRouter from "./base/AuthRouter";

// Fontawesome icons
import loadIcons from "./themes/icons";
loadIcons();

// Initialize CSRF protection for unsafe requests in session-auth flows
import { ensureCsrfInterceptor } from "../utils/csrf";
ensureCsrfInterceptor();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <HelmetProvider>
        <StateProvider>
            <QueryClientProvider client={queryClient}>
                <MantineProvider defaultColorScheme="dark" theme={theme}>
                    <ModalsProvider>
                        <DatesProvider settings={{ locale: "en", consistentWeeks: true, weekendDays: [0] }}>
                            <ReactScan />
                            <SnowOverlay />
                            <Notifications />
                            <Router>
                                <Spotlight />
                                <NuqsAdapter>
                                    <AuthRouter />
                                </NuqsAdapter>
                            </Router>
                        </DatesProvider>
                    </ModalsProvider>
                    <VersionChecker />
                </MantineProvider>
            </QueryClientProvider>
        </StateProvider>
    </HelmetProvider>
);
