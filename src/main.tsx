// Base
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider as StateProvider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import ReactScan from "./base/ReactScan";
import VersionChecker from "./base/VersionChecker";

const queryClient = new QueryClient();

// Mantine
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { theme } from "./themes/main";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./sass/app.scss";

// Layout
import AuthRouter from "./base/AuthRouter";

// Fontawesome icons
import loadIcons from "./themes/icons";
loadIcons();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <HelmetProvider>
        <StateProvider>
            <QueryClientProvider client={queryClient}>
                <MantineProvider defaultColorScheme="dark" theme={theme}>
                    <DatesProvider settings={{ locale: "en", timezone: "UTC", consistentWeeks: true, weekendDays: [0] }}>
                        <ReactScan />
                        <Notifications />
                        <Router>
                            <AuthRouter />
                        </Router>
                    </DatesProvider>
                    <VersionChecker />
                </MantineProvider>
            </QueryClientProvider>
        </StateProvider>
    </HelmetProvider>
);
