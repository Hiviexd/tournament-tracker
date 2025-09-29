import { ITicket } from "./Ticket";
import { ITournament } from "./Tournament";
import { IUser } from "./User";
import { IVoting } from "./Voting";

export interface IDashboardResponse {
    tournaments: ITournament[];
    votings: IVoting[];
    tickets: ITicket[];
    reports: ITicket[];
    users: IUser[];
}
