import { Document } from 'mongoose';
import { IUser } from './User';
import { ITournament } from './Tournament';

export enum NoteType {
    // needs to be uppercase to match the collection names. scuffed, I know.
    User = "User",
    Tournament = "Tournament",
}

export interface INote extends Document {
    type: NoteType;
    author: IUser;
    target: IUser | ITournament;
    content: string;

    // virtuals
    isUser: boolean;
    isTournament: boolean;
}
