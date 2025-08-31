import { Stack } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { ITicket } from "../../../interfaces/Ticket";
import TicketMessage from "./TicketMessage";

interface IProps {
    ticket: ITicket;
}

export default function TicketMessages({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <Stack gap="md">
            {ticket.messages.map((message) => (
                <TicketMessage key={message._id} ticket={ticket} message={message} showTrueAuthor={!!(user && user.isCommitteeOrAdmin)} />
            ))}
        </Stack>
    );
}
