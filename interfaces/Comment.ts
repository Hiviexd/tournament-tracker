import { Document } from 'mongoose';
import { IUser } from './User';

export interface IComment extends Document {
    author: IUser;
    content: string;
    vote: number;
}
