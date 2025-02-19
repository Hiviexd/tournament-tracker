import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserGroup } from "../../interfaces/User";

// Mantine
import { Tabs, Stack } from "@mantine/core";

// Components
import TicketForm from "../components/tickets/TicketForm";
import ReportForm from "../components/tickets/ReportForm";

export interface ITicketFormValues {
    title: string;
    message: string;
    type: "ticket" | "report";
    assignedGroup?: UserGroup;
    targetUserId?: string;
    targetTournamentName?: string;
    targetTournamentLink?: string;
    reportType?: "user" | "tournament";
}

export default function TicketCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialTab = location.pathname.includes("/reports/create") ? "report" : "ticket";
    const [activeTab, setActiveTab] = useState<"ticket" | "report">(initialTab);

    useEffect(() => {
        const newTab = location.pathname.includes("/reports/create") ? "report" : "ticket";
        setActiveTab(newTab);
    }, [location.pathname]);

    const handleTabChange = (value: string | null) => {
        const newTab = (value ?? "ticket") as "ticket" | "report";
        setActiveTab(newTab);
        navigate(newTab === "ticket" ? "/tickets/create" : "/reports/create", { replace: true });
    };

    return (
        <Tabs color="primary.6" value={activeTab} onChange={handleTabChange}>
            <Stack gap="md">
                <Tabs.List>
                    <Tabs.Tab value="report">Report</Tabs.Tab>
                    <Tabs.Tab value="ticket">Ticket</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="report">
                    <ReportForm />
                </Tabs.Panel>

                <Tabs.Panel value="ticket">
                    <TicketForm />
                </Tabs.Panel>
            </Stack>
        </Tabs>
    );
}
