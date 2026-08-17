import User from "../models/userModel";
import utils from "@tc/utils/server";
import OsuApiService from "../services/OsuApiService";
import { IUser } from "@tc/types/User";
import { Request, Response, NextFunction } from "express";

function deny(req: Request, res: Response) {
    if (req.accepts(["html", "json"]) === "json") {
        res.status(401).json({ error: "Unauthorized, login first" });
    } else {
        res.redirect("/");
    }
}

function requireRole(isAllowed: (user: IUser) => boolean) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!checkApiKeyAccess(res)) return;

        const user = res.locals!.user;
        if (user && isAllowed(user)) return next();

        deny(req, res);
    };
}

/**
 * Check apiKey request has been granted access via requireScopes middleware
 * @param res
 * @returns boolean
 */
function checkApiKeyAccess(res: Response): boolean {
    if (res.locals?.authMethod === "apiKey" && !res.locals?.isAccessibleViaKey) {
        res.status(403).json({ error: "API is not accessible via key" });
        return false;
    }
    return true;
}

/**
 * Check if user is logged in, and assign user to res.locals
 * @param req
 * @param res
 * @param next
 */
async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    if (!checkApiKeyAccess(res)) return;

    const user = await User.findById(req.session.mongoId || res.locals!.user?._id);

    if (!user) {
        return deny(req, res);
    }

    // Refresh if less than 2 hours left for some possible edge cases
    if (new Date() > new Date(req.session.expireDate! - 2 * 3600 * 1000)) {
        const response = await OsuApiService.refreshToken(req.session.refreshToken!);

        if (!response || OsuApiService.isOsuResponseError(response)) {
            req.session.destroy((error) => {
                console.log(error);
            });

            return res.redirect("/");
        }

        utils.setSession(req.session, response);
    }

    res.locals!.user = user;
    next();
}

// Hierarchy: each role includes everyone above it (dev -> admin -> committee)
const isDev = requireRole((user) => user.isDev);
const isAdmin = requireRole((user) => user.isDev || user.isAdmin);
const isCommittee = requireRole((user) => user.isDev || user.isAdmin || user.isCommittee);

/**
 * Optional authentication middleware
 * Allows logged-out users to access routes, but still sets res.locals for logged-in users
 * @param req
 * @param res
 * @param next
 */
async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    if (!checkApiKeyAccess(res)) return;

    if (!req.session || !req.session.mongoId) {
        return next();
    }

    const user = await User.findById(req.session.mongoId || res.locals!.user?._id);

    if (!user) {
        return next();
    }

    // Refresh token if less than 2 hours left
    if (req.session.expireDate && new Date() > new Date(req.session.expireDate - 2 * 3600 * 1000)) {
        const response = await OsuApiService.refreshToken(req.session.refreshToken!);

        if (!response || OsuApiService.isOsuResponseError(response)) {
            req.session.destroy((error) => {
                console.log(error);
            });

            return next();
        }

        utils.setSession(req.session, response);
    }

    res.locals!.user = user;
    next();
}

export default {
    isLoggedIn,
    isCommittee,
    isAdmin,
    isDev,
    optionalAuth,
};
