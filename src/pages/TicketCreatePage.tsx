import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCreateTicket } from "../hooks/useTickets";
import { UserGroup } from "../../interfaces/User";

// Mantine
import { Tabs, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";

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
    targetTournamentForumUrl?: string;
}

export default function TicketCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const createTicketMutation = useCreateTicket();

    // Update route based on tab selection
    const initialTab = location.pathname.includes("/reports/create") ? "report" : "ticket";
    const [activeTab, setActiveTab] = useState<"ticket" | "report">(initialTab);

    const handleTabChange = (value: string | null) => {
        const newTab = (value ?? "ticket") as "ticket" | "report";
        setActiveTab(newTab);
        navigate(newTab === "ticket" ? "/tickets/create" : "/reports/create", { replace: true });
    };

    const form = useForm<ITicketFormValues>({
        initialValues: {
            title: "",
            message: "",
            type: activeTab,
        },
        validate: {
            title: (value, values) => (values.type === "ticket" && !value ? "Title is required" : null),
            message: (value) => (!value ? "Message is required" : null),
            assignedGroup: (value) => (!value ? "Committee selection is required" : null),
            targetUserId: (value, values) =>
                values.type === "report" && !value && !values.targetTournamentName
                    ? "Either user or tournament must be selected"
                    : null,
            targetTournamentName: (value, values) => {
                if (values.type === "report" && !values.targetUserId && !value) {
                    return "Either user or tournament must be selected";
                }
                if (values.type === "report" && value && !values.targetTournamentForumUrl) {
                    return "Forum URL is required for tournament reports";
                }
                return null;
            },
            targetTournamentForumUrl: (value, values) =>
                values.type === "report" && values.targetTournamentName && !value
                    ? "Forum URL is required for tournament reports"
                    : null,
        },
    });

    useEffect(() => {
        form.setFieldValue("type", activeTab);
    }, [activeTab, form]);

    const handleSubmit = async (values: ITicketFormValues) => {
        await createTicketMutation.mutateAsync({
            ...values,
            type: activeTab,
        });
        navigate("/tickets");
    };

    return (
        <Tabs value={activeTab} onChange={handleTabChange}>
            <Stack gap="md">
                <Tabs.List>
                    <Tabs.Tab value="ticket">Ticket</Tabs.Tab>
                    <Tabs.Tab value="report">Report</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="ticket">
                    <TicketForm form={form} onSubmit={handleSubmit} />
                </Tabs.Panel>

                <Tabs.Panel value="report">
                    <ReportForm form={form} onSubmit={handleSubmit} />
                </Tabs.Panel>
            </Stack>
        </Tabs>
    );
}
