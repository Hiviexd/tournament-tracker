import crypto from "crypto";
import config from "../../config.json";
import OsuApi from "../helpers/classes/OsuApi";
import helpers from "../helpers";
import UsersController from "./UsersController";

class AuthController {
    /** osu! OAuth login */
    public login(req, res): void {
        const state = crypto.randomBytes(48).toString("hex");
        res.cookie("_state", state, { httpOnly: true });
        const hashedState = Buffer.from(state).toString("base64");

        if (!req.session.lastPage) {
            req.session.lastPage = req.get("referer");
        }

        res.redirect(
            `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${
                config.osuApp.id
            }&redirect_uri=${encodeURIComponent(
                config.osuApp.redirect
            )}&state=${hashedState}&scope=identify`
        );
    }

    /** Log out through destroying session */
    public logout(req, res): void {
        req.session.destroy(() => {
            res.redirect("/");
        });
    }

    /** osu! OAuth callback */
    public async callback(req, res) {
        if (!req.query.code || req.query.error || !req.query.state) {
            return res.status(500).redirect("/error");
        }

        const decodedState = Buffer.from(req.query.state.toString(), "base64").toString("ascii");
        const savedState = req.cookies._state;
        res.clearCookie("_state");

        if (decodedState !== savedState) {
            return res.status(403).redirect("/error");
        }

        const tokenResponse = await OsuApi.getToken(req.query.code.toString());

        if (OsuApi.isOsuResponseError(tokenResponse)) {
            return res.status(500).redirect("/error");
        }

        helpers.setSession(req.session, tokenResponse);
        const userResponse = await OsuApi.getLoggedInUserInfo(req.session.accessToken!);

        if (OsuApi.isOsuResponseError(userResponse)) {
            return req.session.destroy(() => {
                res.status(500).redirect("/error");
            });
        }

        // Process user
        const user = await UsersController.createOrUpdateUser(userResponse);

        req.session.mongoId = user._id;
        req.session.osuId = user.osuId;
        req.session.username = user.username;

        const lastPage = req.session.lastPage || "/";
        req.session.lastPage = undefined;

        res.redirect(lastPage);
    }
}

export default new AuthController();
