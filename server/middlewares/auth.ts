import User from "../models/userModel";
import utils from "../../utils";
import OsuApiService from "../services/OsuApiService";
import { Request, Response, NextFunction } from "express";

/**
 * Unauthorized middleware
 * @param req
 * @param res
 * @param next
 */
function unauthorize(req: Request, res: Response, next: NextFunction) {
    // Admin bypass
    const user = res.locals!.user || null;
    if (user && (user.isAdmin || user.isDev)) {
        return next();
    }

    if (req.accepts(["html", "json"]) === "json") {
        res.status(401).json({ error: "Unauthorized, login first" });
    } else {
        res.redirect("/");
    }
}

function checkApiKeyAccess(res: Response): boolean {
    if (!res.locals?.isAccessibleViaKey) {
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

    const user = await User.findById(req.session.mongoId);

    if (!user) {
        return unauthorize(req, res, next);
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

/**
 * Check if user is part of a committee
 * @param req
 * @param res
 * @param next
 */
function isCommittee(req: Request, res: Response, next: NextFunction) {
    if (!checkApiKeyAccess(res)) return;

    const user = res.locals!.user;
    if (!user || !user.isCommittee) return unauthorize(req, res, next);

    next();
}

/**
 * Check if user is admin
 * @param req
 * @param res
 * @param next
 */
function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!checkApiKeyAccess(res)) return;

    const user = res.locals!.user;
    if (!user || !user.isAdmin) return unauthorize(req, res, next);

    next();
}

/**
 * Check if user is dev
 * @param req
 * @param res
 * @param next
 */
function isDev(req: Request, res: Response, next: NextFunction) {
    if (!checkApiKeyAccess(res)) return;

    const user = res.locals!.user;
    if (!user || !user.isDev) return unauthorize(req, res, next);

    next();
}

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

    const user = await User.findById(req.session.mongoId);

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
