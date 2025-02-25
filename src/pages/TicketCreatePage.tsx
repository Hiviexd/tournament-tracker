import { UserGroup } from "../../interfaces/User";
import TicketForm from "../components/tickets/TicketForm";
import ReportForm from "../components/tickets/ReportForm";
import { useLocation } from "react-router-dom";

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
    const location = useLocation();
    const isReport = location.pathname.includes("/reports/create");

    return isReport ? <ReportForm /> : <TicketForm />;
}
