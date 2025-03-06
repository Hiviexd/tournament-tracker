import { Request, Response } from "express";

class DevController {
    public getSession(req: Request, res: Response) {
        res.json({
            mongoId: req.session.mongoId,
            osuId: req.session.osuId,
            username: req.session.username,
        });
    }

    public updateSession(req: Request, res: Response) {
        req.session.mongoId = req.body.mongoId;
        req.session.osuId = req.body.osuId;
        req.session.username = req.body.username;

        req.session.save();

        res.json({ message: "Session updated successfully! Refresh to see changes." });
    }
}

export default new DevController();
