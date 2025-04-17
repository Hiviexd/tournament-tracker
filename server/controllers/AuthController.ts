import crypto from "crypto";
import config from "../../config.json";
import OsuApiService from "../services/OsuApiService";
import utils from "../../utils";
import UserService from "../services/UserService";
import User from "../models/userModel";
import { Request, Response } from "express";

class AuthController {
    /** osu! OAuth login */
    public login(req: Request, res: Response): void {
        const state = crypto.randomBytes(48).toString("hex");
        res.cookie("_state", state, { httpOnly: true });
        const hashedState = Buffer.from(state).toString("base64");

        if (!req.session.lastPage) {
            req.session.lastPage = req.get("referer");
        }

        res.redirect(
            `https://osu.ppy.sh/oauth/authorize?response_type=code&client_id=${
                config.osuApp.id
            }&redirect_uri=${encodeURIComponent(config.osuApp.redirect)}&state=${hashedState}&scope=public+identify`
        );
    }

    /** Log out through destroying session */
    public logout(req: Request, res: Response): void {
        req.session.destroy(() => {
            res.redirect("/");
        });
    }

    /** osu! OAuth callback */
    public async callback(req: Request, res: Response) {
        if (!req.query.code || req.query.error || !req.query.state) {
            return res.status(500).redirect("/error");
        }

        const decodedState = Buffer.from(req.query.state.toString(), "base64").toString("ascii");
        const savedState = req.cookies._state;
        res.clearCookie("_state");

        if (decodedState !== savedState) {
            return res.status(403).redirect("/error");
        }

        const tokenResponse = await OsuApiService.getToken(req.query.code.toString());

        if (OsuApiService.isOsuResponseError(tokenResponse)) {
            return res.status(500).redirect("/error");
        }

        utils.setSession(req.session, tokenResponse);
        const userResponse = await OsuApiService.getLoggedInUserInfo(req.session.accessToken!);

        if (OsuApiService.isOsuResponseError(userResponse)) {
            return req.session.destroy(() => {
                res.status(500).redirect("/error");
            });
        }

        // Process user
        const userLookup = await User.findOne({ osuId: userResponse.id });
        const user = await UserService.createOrUpdateUser(userResponse, userLookup);

        req.session.mongoId = user._id;
        req.session.osuId = user.osuId;
        req.session.username = user.username;

        const lastPage = req.session.lastPage || "/";
        req.session.lastPage = undefined;

        res.redirect(lastPage);
    }
}

export default new AuthController();
