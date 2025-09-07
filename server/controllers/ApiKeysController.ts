import { Request, Response } from "express";
import ApiKeyService from "../services/ApiKeyService";

class ApiKeysController {
    /** POST create API key (single per user) - returns raw key once */
    public async create(req: Request, res: Response) {
        const { name } = req.body || {};

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }
        const { rawKey, apiKey } = await ApiKeyService.createKey(res.locals!.user!, {
            name: String(name),
            scopes: ["tournaments:read", "votings:read", "resources:read", "users:read", "tickets:read"],
        });

        return res.status(201).json({ key: rawKey, apiKey: { ...apiKey.toObject(), hashedKey: undefined } });
    }

    /** GET key metadata (no secret) */
    public async get(_: Request, res: Response) {
        const apiKey = await ApiKeyService.getForUser(res.locals!.user!);
        return res.json({ apiKey: apiKey ? { ...apiKey.toObject(), hashedKey: undefined } : null });
    }

    /** POST revoke key */
    public async revoke(_: Request, res: Response) {
        await ApiKeyService.revokeKey(res.locals!.user!);
        return res.json({ message: "API key revoked" });
    }
}

export default new ApiKeysController();
