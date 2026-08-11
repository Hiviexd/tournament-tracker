import { Request, Response } from "express";
import ChecklistService from "../services/ChecklistService";

class ChecklistController {
    /** GET review checklists (TC / CC) */
    public getChecklists(_: Request, res: Response) {
        try {
            return res.json(ChecklistService.getChecklists());
        } catch (error) {
            console.error("Failed to load checklist.json:", error);
            return res.status(500).json({ error: "Failed to load checklist" });
        }
    }
}

export default new ChecklistController();
