import { Session } from "express-session";
import { IUser } from "./User";

declare module "express-session" {
    interface Session {
        mongoId?: string;
        osuId?: number;
        username?: string;
        accessToken?: string;
        refreshToken?: string;
        expireDate?: number;
        lastPage?: string;
    }
}

declare module "express" {
    interface Request {
        session: Session;
    }
}

declare module "express" {
    interface Response {
        locals?: {
            user?: IUser;
        };
    }
}
