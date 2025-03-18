import axios from "axios";
import { TicketQueryParams, type TicketFormData } from "../../interfaces/Ticket";
import { IMessageFormData } from "../../interfaces/Message";

export const getTickets = async (params?: TicketQueryParams) => {
    const response = await axios.get("/api/tickets", { params });
    return response.data;
};

export const getTicket = async (ticketId: string) => {
    const response = await axios.get(`/api/tickets/${ticketId}`);
    return response.data;
};

export const createTicket = async (ticketData: TicketFormData) => {
    const response = await axios.post("/api/tickets/create", ticketData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const sendMessage = async (ticketId: string, messageData: IMessageFormData) => {
    const response = await axios.post(`/api/tickets/${ticketId}/sendMessage`, messageData);
    return response.data;
};

export const toggleStatus = async (ticketId: string) => {
    const response = await axios.post(`/api/tickets/${ticketId}/toggleStatus`);
    return response.data;
};

export const updateThreadId = async (ticketId: string, threadId: string) => {
    const response = await axios.post(`/api/tickets/${ticketId}/updateThreadId`, { threadId });
    return response.data;
};
