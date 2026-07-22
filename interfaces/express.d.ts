import { Session } from "express-session";
import { IUser } from "./User";
import { IApiKey } from "./ApiKey";

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
        files?: Express.Multer.File[];
        /** Raw request body buffer (captured for HMAC verification) */
        rawBody?: Buffer;
    }
}

declare module "express" {
    interface Response {
        locals?: {
            user?: IUser;
            authMethod?: "session" | "apiKey";
            apiKey?: IApiKey;
            isAccessibleViaKey?: boolean;
        };
    }
}
