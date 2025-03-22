import { Request, Response } from "express";
import helpers from "../helpers";

class VersionController {
    public getVersion(_: Request, res: Response) {
        res.json({ hash: helpers.getGitHash() });
    }
}

export default new VersionController();
