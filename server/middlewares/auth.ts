import User from "../models/userModel";
import helpers from "../helpers";
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
    if (user && user.isAdmin) {
        return next();
    }

    if (req.accepts(["html", "json"]) === "json") {
        res.json({ error: "Unauthorized, login first" });
    } else {
        res.redirect("/");
    }
}

/**
 * Check if user is logged in, and assign user to res.locals
 * @param req
 * @param res
 * @param next
 */
async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
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

        helpers.setSession(req.session, response);
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
    const user = res.locals!.user;
    if (!user || !user.isAdmin) return unauthorize(req, res, next);

    next();
}

export default {
    isLoggedIn,
    isCommittee,
    isAdmin,
};
