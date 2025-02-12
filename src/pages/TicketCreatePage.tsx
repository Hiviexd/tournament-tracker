import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "../hooks/useTickets";
import { UserGroup } from "../../interfaces/User";

// Mantine
import { Tabs, Stack, Title } from "@mantine/core";
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
    const createTicketMutation = useCreateTicket();
    const [activeTab, setActiveTab] = useState<"ticket" | "report">("ticket");

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

    const handleSubmit = async (values: ITicketFormValues) => {
        await createTicketMutation.mutateAsync({
            ...values,
            type: activeTab,
        });
        navigate("/tickets");
    };

    return (
        <Stack gap="md">
            <Title order={2}>Create {activeTab === "ticket" ? "Ticket" : "Report"}</Title>

            <Tabs value={activeTab} onChange={(value) => setActiveTab(value as "ticket" | "report")}>
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
            </Tabs>
        </Stack>
    );
}
