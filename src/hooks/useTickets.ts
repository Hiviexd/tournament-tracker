// Base
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ITicket } from "../../interfaces/Ticket";
import { handleMutationResponse } from "../api/helpers";

// API
import { getTickets, getTicket, createTicket, sendMessage, toggleStatus } from "../api/tickets";

// Types
import { TicketQueryParams } from "../../interfaces/Ticket";

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

export function useSendMessage(ticketId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageData: { content: string, isNote: boolean }) => {
            const response = await sendMessage(ticketId, messageData);
            return handleMutationResponse(response, "Message sent successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        },
    });
}

export function useToggleStatus(ticketId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await toggleStatus(ticketId);
            return handleMutationResponse(response, response.message || "Ticket status toggled successfully");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        },
    });
}