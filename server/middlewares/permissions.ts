import User from "../models/userModel";
import helpers from "../helpers";
import OsuApi from "../helpers/classes/OsuApi";

function unauthorize(req, res, next) {
    // Admin bypass
    const user = res.locals.user || null;
    if (user && user.isAdmin) {
        return next();
    }

    if (req.accepts(["html", "json"]) === "json") {
        res.json({ error: "Unauthorized, login first" });
    } else {
        res.redirect("/");
    }
}

async function isLoggedIn(req, res, next) {
    const user = await User.findById(req.session.mongoId);

    if (!user) {
        return unauthorize(req, res, next);
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
    if (!user.isCommittee) return unauthorize(req, res, next);

    next();
}

function isAdmin(req, res, next) {
    const user = res.locals.user;
    if (!user.isAdmin) return unauthorize(req, res, next);

    next();
}

export default {
    isLoggedIn,
    isCommittee,
    isAdmin,
};
