import { Stack } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { IMessage } from "../../../interfaces/Message";
import { ITicket } from "../../../interfaces/Ticket";
import TicketMessage from "./TicketMessage";

interface IProps {
    ticket: ITicket;
    messages: IMessage[];
}

export default function TicketMessages({ ticket, messages }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <Stack gap="md">
            {messages.map((message) => (
                <TicketMessage key={message._id} ticket={ticket} message={message} showTrueAuthor={user!.isCommittee} />
            ))}
        </Stack>
    );
}
