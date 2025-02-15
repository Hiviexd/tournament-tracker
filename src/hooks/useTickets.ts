// Base
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ITicket } from "../../interfaces/Ticket";
import { handleMutationResponse } from "../api/helpers";

// API
import { getTickets, getTicket, createTicket } from "../api/tickets";

// Types
interface TicketQueryParams {
    type?: "ticket" | "report";
    title?: string;
    assignedGroup?: string;
    isActive?: boolean;
    page?: number;
}

export function useTickets(params?: TicketQueryParams) {
    return useQuery({
        queryKey: ["tickets", params],
        queryFn: () => getTickets(params),
    });
}

export function useTicket(ticketId: string) {
    return useQuery({
        queryKey: ["ticket", ticketId],
        queryFn: () => getTicket(ticketId),
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketData: Partial<ITicket>) => {
            const response = await createTicket(ticketData);
            return handleMutationResponse(
                response,
                ticketData.type === "ticket" ? "Ticket created successfully" : "Report submitted successfully"
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        },
    });
}
