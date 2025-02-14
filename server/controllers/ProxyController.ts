import { Request, Response } from "express";
import axios from "axios";

class ProxyController {
    /** Proxy external images through the server */
    public async proxyImage(req: Request, res: Response) {
        if (!req.query.url || typeof req.query.url !== "string") {
            return res.status(400).send("Missing or invalid URL parameter");
        }

        try {
            const response = await axios({
                method: "GET",
                url: req.query.url,
                responseType: "stream",
                headers: {
                    "User-Agent": "TournamentTracker/1.0",
                },
            });

            // Forward content type
            res.setHeader("Content-Type", response.headers["content-type"]);
            // Set CORS headers
            res.setHeader("Access-Control-Allow-Origin", "*");
            // Set cache headers
            res.setHeader("Cache-Control", "public, max-age=86400");

            response.data.pipe(res);
        } catch (error) {
            console.error("Image proxy error:", error);
            res.status(500).send("Failed to proxy image");
        }
    }
}

export default new ProxyController();
