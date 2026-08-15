import { Request, Response } from "express";
import config from "@tc/config";
import { isString } from "@tc/utils/common";
import EnchantSidebarService from "../services/EnchantSidebarService";

class EnchantController {
    /** POST Enchant Sidebar App webhook */
    public async sidebar(req: Request, res: Response) {
        if (!config.enchant?.enabled) {
            return res.status(200).send("");
        }

        const signature = req.headers["enchant-signature"];
        const signatureValue = Array.isArray(signature) ? signature[0] : signature;

        if (!EnchantSidebarService.verifySignature(req.rawBody, signatureValue)) {
            return res.status(401).send("Unauthorized");
        }

        const ticketId = isString(req.body?.id) ? req.body.id : "";
        if (!ticketId) {
            return res.status(200).send("");
        }

        const html = await EnchantSidebarService.buildSidebarHtml(ticketId);
        return res.status(200).type("html").send(html);
    }
}

export default new EnchantController();
