import { Request, Response } from "express";

export function unauthorize(req: Request, res: Response) {
    if (req.accepts(["html", "json"]) === "json") {
        res.json({ error: "Unauthorized, login first" });
    } else {
        res.redirect("/");
    }
}
