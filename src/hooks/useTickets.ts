// Base
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import utils from "../../utils";

// Types
import { ITicketCreateResponse, TicketQueryParams, type TicketFormData } from "../../interfaces/Ticket";
import { IMessageFormData } from "../../interfaces/Message";

export function useTickets(params?: TicketQueryParams) {
    return useQuery({
        queryKey: ["tickets", params],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: "/api/tickets",
                params,
            }),
    });
}

export function useTicket(ticketId: string) {
    return useQuery({
        queryKey: ["ticket", ticketId],
        queryFn: () =>
            utils.apiCall({
                method: "get",
                url: `/api/tickets/${ticketId}`,
            }),
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketData: TicketFormData) => {
            const response = await utils.apiCall<ITicketCreateResponse>({
                method: "post",
                url: "/api/tickets/create",
                data: ticketData,
                headers: { "Content-Type": "multipart/form-data" },
            });
            return utils.handleMutationResponse<ITicketCreateResponse>(response);
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tickets/${ticketId}/sendMessage`,
                data: messageData,
            });
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tickets/${ticketId}/toggleStatus`,
            });
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
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tickets/${ticketId}/updateThreadId`,
                data: { threadId },
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        },
    });
}

export function useSnoozeTicket(ticketId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await utils.apiCall({
                method: "patch",
                url: `/api/tickets/${ticketId}/snooze`,
            });
            return utils.handleMutationResponse(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        },
    });
}
