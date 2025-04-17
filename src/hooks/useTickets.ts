// Base
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";

// API
import { getTickets, getTicket, createTicket, sendMessage, toggleStatus, updateThreadId } from "../api/tickets";

// Types
import { TicketQueryParams, type TicketFormData } from "../../interfaces/Ticket";
import { IMessageFormData } from "../../interfaces/Message";

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
        mutationFn: async (ticketData: TicketFormData) => {
            const response = await createTicket(ticketData);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        },
        onError: (error) => {
            console.error("Create ticket error:", error);
        },
    });
}

export function useSendMessage(ticketId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageData: IMessageFormData) => {
            const response = await sendMessage(ticketId, messageData);
            return utils.handleMutationResponse(response);
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
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        },
    });
}

export function useUpdateThreadId(ticketId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (threadId: string) => {
            const response = await updateThreadId(ticketId, threadId);
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        },
    });
}
