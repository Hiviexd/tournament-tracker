import { unauthorize } from ".";
import User from "../models/userModel";
import helpers from "../helpers";
import OsuApi from "../helpers/OsuApi";
import config from "../../config.json";

async function isLoggedIn(req, res, next) {
    const user = await User.findById(req.session.mongoId);

    if (!user) {
        return unauthorize(req, res);
    }

    // Refresh if less than 2 hours left for some possible edge cases
    if (new Date() > new Date(req.session.expireDate - 2 * 3600 * 1000)) {
        const response = await OsuApi.refreshToken(req.session.refreshToken);

        if (!response || OsuApi.isOsuResponseError(response)) {
            req.session.destroy((error) => {
                console.log(error);
            });

            return res.redirect("/");
        }

        helpers.setSession(req.session, response);
    }

    res.locals.user = user;
    next();
}

function isCommittee(req, res, next) {
    const user = res.locals.user;
    if (!user.isCommittee) return unauthorize(req, res);

    next();
}

function isTournamentCommittee(req, res, next) {
    const user = res.locals.user;
    if (!user.isTournamentCommittee) return unauthorize(req, res);

    next();
}

function isContestCommittee(req, res, next) {
    const user = res.locals.user;
    if (!user.isContestCommittee) return unauthorize(req, res);

    next();
}

function isAdmin(req, res, next) {
    const user = res.locals.user;
    if (!user.isAdmin) return unauthorize(req, res);

    next();
}

function isDev(req, res, next) {
    const user = res.locals.user;
    if (!config.devs.includes(user.osuId)) return unauthorize(req, res);

    next();
}

export default {
    isLoggedIn,
    isCommittee,
    isTournamentCommittee,
    isContestCommittee,
    isAdmin,
    isDev,
};
