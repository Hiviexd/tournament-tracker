import crypto from "crypto";
import config from "../../config.json";
import OsuApi from "../helpers/OsuApi";
import helpers from "../helpers";
import { UserGroup } from "../../interfaces/user";
import User from "../models/user";

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
        const osuId = userResponse.id;
        const username = userResponse.username;
        const groups = UserGroup.User;
        const osuGroups = userResponse.groups;
        const coverUrl = userResponse.cover.url;

        let user = await User.findOne({ osuId });

        if (!user) {
            user = new User({
                osuId,
                username,
                groups,
                osuGroups,
                coverUrl,
            });

            await user.save();
        } else {
            let saveTrigger = false;

            if (user.username !== username) {
                user.username = username;
                saveTrigger = true;
            }

            if (user.coverUrl !== coverUrl) {
                user.coverUrl = coverUrl;
                saveTrigger = true;
            }

            if (user.osuGroups !== osuGroups) {
                user.osuGroups = osuGroups;
                saveTrigger = true;
            }

            if (saveTrigger) {
                await user.save();
            }
        }

        req.session.mongoId = user._id;
        req.session.osuId = osuId;
        req.session.username = username;

        //const lastPage = req.session.lastPage || "/";
        req.session.lastPage = undefined;

        //res.redirect(lastPage);

        res.json({ message: "Logged in", user });
    }
}

export default new AuthController();
