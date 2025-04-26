import { Document } from "mongoose";
import { IUser } from "./User";

export interface IQuote extends Document {
    author: IUser;
    quote: string;
    createdAt: Date;
}
